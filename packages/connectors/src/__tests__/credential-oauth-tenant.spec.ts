import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { CredentialManager } from "../credential-manager.js";
import { OAuthManager } from "../oauth-manager.js";
import { PrismaClient } from "@prisma/client";
import { TenantContextService } from "@oracle69/runtime";

const KEY = "phase3-p1-credential-test-key-abcdefghijklmnop-1234567890";

const ORG_A = "org-a";
const ORG_B = "org-b";

function makePrisma() {
  const store = new Map<string, any>();
  return {
    integrationCredential: {
      findUnique: jest.fn(async ({ where }: any) => {
        const key = `${where.provider_organizationId.provider}:${where.provider_organizationId.organizationId}`;
        return store.get(key) ?? null;
      }),
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const key = `${where.provider_organizationId.provider}:${where.provider_organizationId.organizationId}`;
        const existing = store.get(key);
        const record = existing
          ? { ...existing, ...update, updatedAt: new Date() }
          : { ...create, updatedAt: new Date() };
        store.set(key, record);
        return record;
      }),
    },
  } as any;
}

function makeManager(prisma: any, tenantContext?: TenantContextService) {
  return new CredentialManager(prisma, tenantContext);
}

describe("Phase 3 P1 WS3 — CredentialManager / OAuthManager tenant enforcement", () => {
  let tc: TenantContextService;
  let prisma: any;
  let manager: CredentialManager;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = KEY;
    tc = new TenantContextService();
    prisma = makePrisma();
    manager = makeManager(prisma, tc);
  });

  function runOrg(orgId: string, fn: () => Promise<any>) {
    return tc.run({ tenantId: orgId }, fn);
  }

  it("A. Org-A can access Org-A credentials", async () => {
    await runOrg(ORG_A, async () => {
      await manager.saveCredentials(ORG_A, "gmail", { apiKey: "sk-A" });
      const creds = await manager.getCredentials(ORG_A, "gmail");
      expect(creds).toBeTruthy();
      expect(creds.apiKey).toBe("sk-A");
    });
  });

  it("B. Org-A cannot access Org-B credentials", async () => {
    await runOrg(ORG_A, () =>
      expect(manager.getCredentials(ORG_B, "gmail")).rejects.toBeInstanceOf(
        BadRequestException,
      ),
    );
  });

  it("C. Org-A cannot refresh Org-B credentials", async () => {
    const oauth = new OAuthManager(manager, tc);
    await runOrg(ORG_A, () =>
      expect(oauth.refreshToken(ORG_B, "gmail")).rejects.toBeInstanceOf(
        BadRequestException,
      ),
    );
  });

  it("D. Org-A cannot mutate/delete Org-B credentials (save rejected)", async () => {
    await runOrg(ORG_A, () =>
      expect(
        manager.saveCredentials(ORG_B, "gmail", { apiKey: "evil" }),
      ).rejects.toBeInstanceOf(BadRequestException),
    );
  });

  it("E. Caller-supplied Org-B organizationId cannot override Org-A context", async () => {
    await runOrg(ORG_A, async () => {
      // Even though caller passes org-b, the active tenant is org-a -> rejected.
      await expect(
        manager.getCredentials(ORG_B, "gmail"),
      ).rejects.toBeInstanceOf(BadRequestException);
      // And no Org-B credential was read.
      expect(prisma.integrationCredential.findUnique).not.toHaveBeenCalled();
    });
  });

  it("F. Missing tenant context fails closed for tenant-owned ops", async () => {
    await expect(manager.getCredentials(ORG_A, "gmail")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.integrationCredential.findUnique).not.toHaveBeenCalled();
  });

  it("G. Org-B retains independent access to Org-B credentials", async () => {
    await runOrg(ORG_B, async () => {
      await manager.saveCredentials(ORG_B, "gmail", { apiKey: "sk-B" });
      const creds = await manager.getCredentials(ORG_B, "gmail");
      expect(creds.apiKey).toBe("sk-B");
    });
    await runOrg(ORG_A, async () => {
      await expect(
        manager.getCredentials(ORG_B, "gmail"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it("H. AES-256-GCM round trip preserved with tenant context", async () => {
    await runOrg(ORG_A, async () => {
      await manager.saveCredentials(ORG_A, "hubspot", {
        accessToken: "access-token-secret",
        refreshToken: "refresh-token-secret",
      });
      const creds = await manager.getCredentials(ORG_A, "hubspot");
      expect(creds.accessToken).toBe("access-token-secret");
      expect(creds.refreshToken).toBe("refresh-token-secret");
    });
  });
});