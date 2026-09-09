import "reflect-metadata";
import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import { Global, Module } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import { PlatformApiKeyService } from "../platform/platform-api-key.service.js";
import { PlatformAuthGuard } from "../platform/platform-auth.guard.js";
import { PrismaService } from "../prisma/prisma.service.js";
import * as crypto from "crypto";

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: {
        platformApiKey: {
          create: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
        },
        // @ts-ignore
        $connect: jest.fn().mockResolvedValue(undefined),
      } as any,
    },
    {
      provide: "PrismaService",
      useExisting: PrismaClient,
    },
    {
      provide: PrismaService,
      useExisting: PrismaClient,
    },
  ],
  exports: [PrismaClient, "PrismaService", PrismaService],
})
class MockPrismaModule {}

describe("Platform API-key authentication (SEC-5)", () => {
  let moduleRef: TestingModule;
  let service: PlatformApiKeyService;
  let guard: PlatformAuthGuard;
  let prisma: any;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MockPrismaModule],
      providers: [PlatformApiKeyService, PlatformAuthGuard],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(PlatformApiKeyService);
    guard = moduleRef.get(PlatformAuthGuard);
    prisma = moduleRef.get(PrismaClient);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("generates cryptographically random keys (not based on Math.random())", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(service.generateRawKey());
    }
    expect(keys.size).toBe(100);
    for (const k of keys) {
      expect(k.startsWith("pk_")).toBe(true);
      const randomPart = k.slice("pk_".length);
      expect(randomPart.length).toBeGreaterThanOrEqual(40);
    }
    const spy = jest.spyOn(Math, "random");
    const k = service.generateRawKey();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    expect(k.startsWith("pk_")).toBe(true);
  });

  it("stores a cryptographic hash, not the plaintext secret", async () => {
    const orgId = "org-A";
    (prisma.platformApiKey.create as any).mockResolvedValue({
      id: "key-1",
      name: "test",
      keyHash: "hash",
      keyPrefix: "prefix",
      organizationId: orgId,
      status: "active",
      expiresAt: null,
      createdAt: new Date(),
    });
    const result = await service.createKey(orgId, "test");
    const createData = (prisma.platformApiKey.create as any).mock.calls[0][0].data;
    expect(createData.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(createData.keyHash).not.toContain(result.apiKey);
    expect(createData.keyHash).toBe(service.hashKey(result.apiKey));
  });

  async function authContextWithKey(apiKey: string): Promise<any> {
    const req = { headers: { "x-api-key": apiKey }, tenantContext: null, platformApiKey: null };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as any;
    return { req, ctx };
  }

  it("a valid persisted key succeeds and resolves the correct tenant", async () => {
    const raw = service.generateRawKey();
    const hash = service.hashKey(raw);
    const prefix = service.derivePrefix(raw);
    (prisma.platformApiKey.findMany as any).mockResolvedValue([
      {
        id: "k1",
        name: "x",
        keyHash: hash,
        keyPrefix: prefix,
        status: "active",
        expiresAt: null,
        organizationId: "org-A",
        updatedAt: new Date(),
      },
    ]);
    (prisma.platformApiKey.update as any).mockResolvedValue({});
    const { ctx, req } = await authContextWithKey(raw);
    const ok = await guard.canActivate(ctx);
    expect(ok).toBe(true);
    expect(req.tenantContext.organizationId).toBe("org-A");
    expect(req.platformApiKey.id).toBe("k1");
  });

  it("a nonexistent pk_ key fails", async () => {
    (prisma.platformApiKey.findMany as any).mockResolvedValue([]);
    const { ctx } = await authContextWithKey(service.generateRawKey());
    await expect(guard.canActivate(ctx)).rejects.toThrow("Invalid platform API key");
  });

  it("a malformed key (not pk_ prefixed) fails", async () => {
    const { ctx } = await authContextWithKey("not-a-key-format");
    await expect(guard.canActivate(ctx)).rejects.toThrow("Invalid platform API key");
  });

  it("a missing key fails", async () => {
    const { ctx } = await authContextWithKey("");
    await expect(guard.canActivate(ctx)).rejects.toThrow("Missing platform API key");
  });

  it("a revoked/inactive key fails", async () => {
    const raw = service.generateRawKey();
    const hash = service.hashKey(raw);
    const prefix = service.derivePrefix(raw);
    (prisma.platformApiKey.findMany as any).mockResolvedValue([
      {
        id: "k2",
        name: "x",
        keyHash: hash,
        keyPrefix: prefix,
        status: "revoked",
        expiresAt: null,
        organizationId: "org-A",
        updatedAt: new Date(),
      },
    ]);
    const { ctx } = await authContextWithKey(raw);
    await expect(guard.canActivate(ctx)).rejects.toThrow("is not active");
  });

  it("an expired key fails", async () => {
    const raw = service.generateRawKey();
    (prisma.platformApiKey.findMany as any).mockResolvedValue([
      {
        id: "k3",
        name: "x",
        keyHash: service.hashKey(raw),
        keyPrefix: service.derivePrefix(raw),
        status: "active",
        expiresAt: new Date(Date.now() - 1000),
        organizationId: "org-A",
        updatedAt: new Date(),
      },
    ]);
    const { ctx } = await authContextWithKey(raw);
    await expect(guard.canActivate(ctx)).rejects.toThrow("expired");
  });

  it("a key from organization A cannot authenticate as organization B", async () => {
    const raw = service.generateRawKey();
    (prisma.platformApiKey.findMany as any).mockResolvedValue([
      {
        id: "kA",
        name: "x",
        keyHash: service.hashKey(raw),
        keyPrefix: service.derivePrefix(raw),
        status: "active",
        expiresAt: null,
        organizationId: "org-A",
        updatedAt: new Date(),
      },
    ]);
    (prisma.platformApiKey.update as any).mockResolvedValue({});
    const { ctx, req } = await authContextWithKey(raw);
    await guard.canActivate(ctx);
    expect(req.tenantContext.organizationId).toBe("org-A");
    expect(req.tenantContext.organizationId).not.toBe("org-B");
  });

  it("does not accept a key based solely on pk_ prefix", async () => {
    (prisma.platformApiKey.findMany as any).mockResolvedValue([]);
    const { ctx } = await authContextWithKey("pk_fake-key-that-starts-with-prefix-only");
    await expect(guard.canActivate(ctx)).rejects.toThrow("Invalid platform API key");
  });
});
