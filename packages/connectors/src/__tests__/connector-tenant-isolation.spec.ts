import { jest, describe, it, expect } from "@jest/globals";
import { ConnectorManager } from "../connector-manager.js";
import { IConnector, ConnectorResult } from "../types.js";
import { TenantContextService, TenantContextError } from "@oracle69/runtime";

function stubConnector(id: string, type: string): IConnector {
  return {
    metadata: { id, name: id, type, version: "1", capabilities: [] },
    connect: jest.fn(async () => {}),
    disconnect: jest.fn(async () => {}),
    authenticate: jest.fn(async () => true),
    execute: jest.fn(async (): Promise<ConnectorResult> => ({ success: true, data: { ok: true } })),
    health: jest.fn(async () => ({ status: "connected", lastCheck: new Date() })),
  } as any;
}

function setup() {
  const tenantContext = new TenantContextService();
  const connector = stubConnector("gmail-1", "gmail");
  const registry = { resolve: jest.fn(() => connector) } as any;

  const credentialManager = {
    getCredentials: jest.fn(),
    saveCredentials: jest.fn(),
  } as any;
  const oauthManager = {
    isTokenExpired: jest.fn(),
    refreshToken: jest.fn(),
  } as any;
  const eventBus = {
    publish: jest.fn(),
  } as any;
  const memoryManager = {
    saveBusinessMemory: jest.fn(),
  } as any;

  const manager = new ConnectorManager(
    registry,
    credentialManager,
    oauthManager,
    eventBus,
    memoryManager,
    tenantContext,
  );

  function runForTenant(orgId: string, type: string, request: any) {
    return tenantContext.run({ tenantId: orgId }, () => manager.executeAction(type, request));
  }

  return { manager, connector, registry, credentialManager, oauthManager, eventBus, memoryManager, tenantContext, runForTenant };
}

function request(organizationId: string, action = "send") {
  return { action, params: {}, organizationId, userId: "u1" };
}

describe("Connector tenant isolation", () => {
  it("I: tenant A can access its own connector credentials", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockResolvedValue({
      type: "apiKey",
      apiKey: "key-A",
    });
    await s.runForTenant("org-A", "gmail", request("org-A"));
    expect(s.credentialManager.getCredentials).toHaveBeenCalledWith("org-A", "gmail");
    expect(s.connector.execute).toHaveBeenCalled();
  });

  it("J: tenant B can access its own connector credentials", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockResolvedValue({
      type: "apiKey",
      apiKey: "key-B",
    });
    await s.runForTenant("org-B", "gmail", request("org-B"));
    expect(s.credentialManager.getCredentials).toHaveBeenCalledWith("org-B", "gmail");
  });

  it("K: tenant A cannot access tenant B credentials (B credentials never fetched for A)", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockResolvedValue(null);
    await s.runForTenant("org-A", "gmail", request("org-B"));
    // Credentials are scoped to the trusted tenant (org-A), not the client value.
    expect(s.credentialManager.getCredentials).toHaveBeenCalledWith("org-A", "gmail");
    expect(s.credentialManager.getCredentials).not.toHaveBeenCalledWith("org-B", "gmail");
  });

  it("L: tenant B cannot access tenant A credentials", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockResolvedValue(null);
    await s.runForTenant("org-B", "gmail", request("org-A"));
    expect(s.credentialManager.getCredentials).toHaveBeenCalledWith("org-B", "gmail");
    expect(s.credentialManager.getCredentials).not.toHaveBeenCalledWith("org-A", "gmail");
  });

  it("M: client-supplied organizationId cannot override authenticated tenant", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockResolvedValue({
      type: "apiKey",
      apiKey: "key-A",
    });
    // Authenticated tenant is org-A but the client claims org-B.
    await s.runForTenant("org-A", "gmail", request("org-B"));
    expect(s.credentialManager.getCredentials).toHaveBeenCalledWith("org-A", "gmail");
    // Every event must carry the trusted tenant org-A, not the client org-B.
    for (const call of s.eventBus.publish.mock.calls) {
      const payloadOrg = (call[0] as any).payload?.organizationId;
      if (payloadOrg !== undefined) {
        expect(payloadOrg).toBe("org-A");
      }
    }
  });

  it("N: tenant A token refresh cannot operate on tenant B credentials", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockImplementation(async (orgId: string) => {
      return orgId === "org-B"
        ? { type: "oauth2", refreshToken: "rt-B", expiresAt: new Date(Date.now() - 1000) }
        : null;
    });
    s.oauthManager.isTokenExpired.mockResolvedValue(true);
    s.oauthManager.refreshToken.mockResolvedValue("new-token");
    // Auth tenant is org-A; getCredentials returns null for org-A so no refresh
    // should operate on org-B's refresh token.
    await s.runForTenant("org-A", "gmail", request("org-B"));
    expect(s.credentialManager.getCredentials).toHaveBeenCalledWith("org-A", "gmail");
    expect(s.credentialManager.getCredentials).not.toHaveBeenCalledWith("org-B", "gmail");
    expect(s.oauthManager.refreshToken).not.toHaveBeenCalledWith("org-B", "gmail");
  });

  it("O: connector memory remains tenant-scoped", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockResolvedValue({
      type: "apiKey",
      apiKey: "key-A",
    });
    await s.runForTenant("org-A", "gmail", request("org-B"));
    const record = s.memoryManager.saveBusinessMemory.mock.calls[0][0];
    expect(record.organizationId).toBe("org-A");
    // sessionId is tenant-qualified and not the raw client org
    expect(record.sessionId).toContain("org-A::");
  });

  it("P: connector events remain tenant-scoped", async () => {
    const s = setup();
    s.credentialManager.getCredentials.mockResolvedValue({
      type: "apiKey",
      apiKey: "key-A",
    });
    await s.runForTenant("org-A", "gmail", request("org-B"));
    const published = s.eventBus.publish.mock.calls.map((c) => c[0]);
    expect(published.length).toBeGreaterThan(0);
    for (const e of published) {
      expect(e.payload.organizationId).toBe("org-A");
      expect(e.payload.organizationId).not.toBe("org-B");
    }
  });

  it("Q: missing tenant context fails closed", async () => {
    const s = setup();
    await expect(s.manager.executeAction("gmail", request("org-A"))).rejects.toBeInstanceOf(
      TenantContextError,
    );
    expect(s.credentialManager.getCredentials).not.toHaveBeenCalled();
  });
});
