import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from "@jest/globals";
import { Global, Module, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import { AuthService } from "../auth/auth.service.js";
import { AuthController } from "../auth/auth.controller.js";
import { JwtStrategy } from "../auth/jwt.strategy.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { UsersService } from "../users/users.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { validateConfig } from "../config/config.validation.js";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";
const ORIGINAL_ENV = process.env.JWT_SECRET;

const USER = {
  id: "user-1",
  email: "user@example.com",
  password: "hashed-password",
  name: "User",
  role: "employee",
  organizationId: "org-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

interface RefreshRecord {
  id: string;
  jti: string;
  tokenHash: string;
  userId: string;
  organizationId: string;
  status: string;
  expiresAt: Date;
  issuedAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshStore = new Map<string, RefreshRecord>();
const userStore = new Map<string, any>();

function matchesWhere(record: any, where: any): boolean {
  return Object.entries(where ?? {}).every(([key, value]) => record[key] === value);
}

const refreshTokenCreateMock = jest.fn(async ({ data }: any): Promise<RefreshRecord> => {
  const now = new Date();
  const record: RefreshRecord = {
    id: `rt-${data.jti}`,
    jti: data.jti,
    tokenHash: data.tokenHash,
    userId: data.userId,
    organizationId: data.organizationId,
    status: data.status,
    expiresAt: data.expiresAt,
    issuedAt: data.issuedAt,
    usedAt: null,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  refreshStore.set(record.jti, record);
  return record;
});

const refreshTokenFindUniqueMock = jest.fn(async ({ where }: any): Promise<RefreshRecord | null> => {
  if (where?.jti) {
    return refreshStore.get(where.jti) ?? null;
  }
  if (where?.id) {
    for (const record of refreshStore.values()) {
      if (record.id === where.id) {
        return record;
      }
    }
  }
  return null;
});

const refreshTokenUpdateManyMock = jest.fn(async ({ where, data }: any): Promise<{ count: number }> => {
  let count = 0;
  for (const record of refreshStore.values()) {
    if (matchesWhere(record, where)) {
      Object.assign(record, data, { updatedAt: new Date() });
      count += 1;
    }
  }
  return { count };
});

const refreshTokenDelegate = {
  create: refreshTokenCreateMock,
  findUnique: refreshTokenFindUniqueMock,
  updateMany: refreshTokenUpdateManyMock,
};

const userFindUniqueMock = jest.fn(async ({ where }: any): Promise<any> => {
  if (where?.id) {
    return userStore.get(where.id) ?? null;
  }
  if (where?.email) {
    for (const user of userStore.values()) {
      if (user.email === where.email) {
        return user;
      }
    }
  }
  return null;
});

const userDelegate = { findUnique: userFindUniqueMock };

const txApi = {
  refreshToken: refreshTokenDelegate,
  user: userDelegate,
  organization: { create: jest.fn(async ({ data }: any) => ({ id: "org-new", ...data })) },
};

const transactionMock = jest.fn(async (callback: any): Promise<any> => {
  if (typeof callback === "function") {
    return callback(txApi);
  }
  return Promise.all(callback);
});

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: {
        user: userDelegate,
        refreshToken: refreshTokenDelegate,
        // @ts-ignore
        $connect: jest.fn().mockResolvedValue(undefined),
        // @ts-ignore
        $transaction: transactionMock,
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
class MockPrismaModuleGlobal {}

describe("Auth refresh-token persistence and rotation (Batch 3A)", () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let authController: AuthController;
  let jwtService: JwtService;

  async function buildModule() {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.getOrThrow<string>("JWT_SECRET"),
            signOptions: { expiresIn: "1h", algorithm: "HS256" },
          }),
          inject: [ConfigService],
        }),
        MockPrismaModuleGlobal,
      ],
      providers: [AuthService, UsersService, JwtStrategy, JwtAuthGuard, RolesGuard],
      controllers: [AuthController],
    }).compile();
  }

  function signRefreshToken(payload: Record<string, unknown>): string {
    return jwtService.sign(
      {
        sub: USER.id,
        email: USER.email,
        role: USER.role,
        organizationId: USER.organizationId,
        tokenType: "refresh",
        type: "refresh",
        ...payload,
      },
      { expiresIn: "7d" },
    );
  }

  function seedRecord(overrides: Partial<RefreshRecord> & { jti: string }): RefreshRecord {
    const now = new Date();
    const record: RefreshRecord = {
      id: `rt-${overrides.jti}`,
      tokenHash: sha256Hex("placeholder"),
      userId: USER.id,
      organizationId: USER.organizationId,
      status: "active",
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      issuedAt: now,
      usedAt: null,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
    refreshStore.set(record.jti, record);
    return record;
  }

  /** Issues a real login pair and returns it with its decoded jti. */
  async function loginPair() {
    const result = await authService.login({ ...USER });
    const decoded = jwtService.verify<{ jti: string }>(result.refresh_token);
    return { ...result, jti: decoded.jti };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    moduleRef = await buildModule();
    await moduleRef.init();
    authService = moduleRef.get(AuthService);
    authController = moduleRef.get(AuthController);
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = ORIGINAL_ENV;
    }
    await moduleRef?.close();
  });

  beforeEach(() => {
    refreshStore.clear();
    userStore.clear();
    userStore.set(USER.id, { ...USER });
    jest.clearAllMocks();
  });

  it("login persists a refresh-token hash for the issued token", async () => {
    const result = await authService.login({ ...USER });
    const decoded = jwtService.verify<{ jti: string }>(result.refresh_token);
    expect(decoded.jti).toBeDefined();

    const record = refreshStore.get(decoded.jti);
    expect(record).toBeDefined();
    expect(record?.userId).toBe(USER.id);
    expect(record?.organizationId).toBe(USER.organizationId);
    expect(record?.status).toBe("active");
    expect(record?.tokenHash).toBe(sha256Hex(result.refresh_token));
    expect(record?.tokenHash).not.toBe(result.refresh_token);
  });

  it("1. valid refresh token succeeds and preserves the response contract", async () => {
    const issued = await loginPair();
    const result = await authService.refreshToken(issued.refresh_token);

    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
    expect(result.expires_in).toBe(3600);
    expect(result.token_type).toBe("Bearer");
    expect(result.user).toEqual({
      id: USER.id,
      email: USER.email,
      name: USER.name,
      role: USER.role,
      organizationId: USER.organizationId,
    });
  });

  it("2. expired refresh JWT fails", async () => {
    // Signed with a bare JwtService (no signOptions) so the explicit past exp
    // claim is preserved instead of conflicting with expiresIn.
    const bareJwt = new JwtService({ secret: JWT_SECRET });
    const expired = bareJwt.sign({
      sub: USER.id,
      email: USER.email,
      role: USER.role,
      organizationId: USER.organizationId,
      jti: "expired-jti",
      tokenType: "refresh",
      type: "refresh",
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    await expect(authService.refreshToken(expired)).rejects.toThrow(UnauthorizedException);
  });

  it("2b. server-side expiry of the persisted record fails even with a valid JWT", async () => {
    const issued = await loginPair();
    const record = refreshStore.get(issued.jti);
    expect(record).toBeDefined();
    record!.expiresAt = new Date(Date.now() - 1000);
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("3. wrong token type (access token) fails", async () => {
    const issued = await loginPair();
    await expect(authService.refreshToken(issued.access_token)).rejects.toThrow(UnauthorizedException);
  });

  it("4. unknown jti fails", async () => {
    const token = signRefreshToken({ jti: "never-persisted-jti" });
    await expect(authService.refreshToken(token)).rejects.toThrow(UnauthorizedException);
  });

  it("5. revoked/used persisted token fails", async () => {
    const issued = await loginPair();
    const record = refreshStore.get(issued.jti);
    expect(record).toBeDefined();
    record!.status = "revoked";
    record!.revokedAt = new Date();
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);

    record!.status = "used";
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("6. token hash mismatch fails", async () => {
    const issued = await loginPair();
    const record = refreshStore.get(issued.jti);
    expect(record).toBeDefined();
    record!.tokenHash = sha256Hex("some-other-token-value");
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("7. user mismatch fails", async () => {
    const issued = await loginPair();
    const record = refreshStore.get(issued.jti);
    expect(record).toBeDefined();
    record!.userId = "another-user-id";
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("8. organization mismatch fails", async () => {
    const issued = await loginPair();
    const record = refreshStore.get(issued.jti);
    expect(record).toBeDefined();
    record!.organizationId = "another-org-id";
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("8b. fallback organizationId 'system' is rejected", async () => {
    const token = signRefreshToken({ jti: "system-org-jti", organizationId: "system" });
    seedRecord({ jti: "system-org-jti", organizationId: "system", tokenHash: sha256Hex(token) });
    await expect(authService.refreshToken(token)).rejects.toThrow(UnauthorizedException);
  });

  it("9. successful rotation invalidates the old token", async () => {
    const issued = await loginPair();
    await authService.refreshToken(issued.refresh_token);

    const oldRecord = refreshStore.get(issued.jti);
    expect(oldRecord?.status).toBe("revoked");
    expect(oldRecord?.usedAt).toBeInstanceOf(Date);
    expect(oldRecord?.revokedAt).toBeInstanceOf(Date);

    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("10. successful rotation creates a new jti", async () => {
    const issued = await loginPair();
    const result = await authService.refreshToken(issued.refresh_token);
    const decoded = jwtService.verify<{ jti: string }>(result.refresh_token);
    expect(decoded.jti).toBeDefined();
    expect(decoded.jti).not.toBe(issued.jti);
  });

  it("11. replacement token is persisted", async () => {
    const issued = await loginPair();
    const result = await authService.refreshToken(issued.refresh_token);
    const decoded = jwtService.verify<{ jti: string }>(result.refresh_token);

    const replacement = refreshStore.get(decoded.jti);
    expect(replacement).toBeDefined();
    expect(replacement?.status).toBe("active");
    expect(replacement?.tokenHash).toBe(sha256Hex(result.refresh_token));
  });

  it("12. replacement token preserves user/organization identity", async () => {
    const issued = await loginPair();
    const result = await authService.refreshToken(issued.refresh_token);
    const decoded = jwtService.verify<{ jti: string; sub: string; organizationId: string }>(
      result.refresh_token,
    );

    expect(decoded.sub).toBe(USER.id);
    expect(decoded.organizationId).toBe(USER.organizationId);

    const replacement = refreshStore.get(decoded.jti);
    expect(replacement?.userId).toBe(USER.id);
    expect(replacement?.organizationId).toBe(USER.organizationId);
    expect(result.user.organizationId).toBe(USER.organizationId);
  });

  it("13. raw refresh token is not persisted", async () => {
    const issued = await loginPair();
    const result = await authService.refreshToken(issued.refresh_token);

    const persistedBlobs = [
      ...refreshTokenCreateMock.mock.calls.map((call) => JSON.stringify(call)),
      ...[...refreshStore.values()].map((record) => JSON.stringify(record)),
    ].join("\n");

    expect(persistedBlobs).not.toContain(issued.refresh_token);
    expect(persistedBlobs).not.toContain(result.refresh_token);
    for (const record of refreshStore.values()) {
      expect(record.tokenHash).not.toBe(issued.refresh_token);
      expect(record.tokenHash).not.toBe(result.refresh_token);
    }
  });

  it("14. concurrent/repeated use of the same old token cannot produce two successful rotations", async () => {
    const issued = await loginPair();

    const outcomes = await Promise.allSettled([
      authService.refreshToken(issued.refresh_token),
      authService.refreshToken(issued.refresh_token),
    ]);

    const fulfilled = outcomes.filter((outcome) => outcome.status === "fulfilled");
    const rejected = outcomes.filter((outcome) => outcome.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(UnauthorizedException);

    const activeRecords = [...refreshStore.values()].filter((record) => record.status === "active");
    expect(activeRecords).toHaveLength(1);
    expect(activeRecords[0].jti).not.toBe(issued.jti);
  });

  it("refresh via the controller delegates to the hardened service", async () => {
    const issued = await loginPair();
    const result = await authController.refresh({ refresh_token: issued.refresh_token });
    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).not.toBe(issued.refresh_token);
  });

  it("does not log raw tokens, hashes, secrets, or passwords", async () => {
    const issued = await loginPair();
    const record = refreshStore.get(issued.jti);
    expect(record).toBeDefined();

    const logged: string[] = [];
    const spyLog = jest.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(" "));
    });
    const spyError = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(" "));
    });
    const spyWarn = jest.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(" "));
    });
    try {
      await authService.refreshToken(issued.refresh_token);
    } finally {
      spyLog.mockRestore();
      spyError.mockRestore();
      spyWarn.mockRestore();
    }

    const output = logged.join("\n");
    expect(output).not.toContain(issued.refresh_token);
    expect(output).not.toContain(record!.tokenHash);
    expect(output).not.toContain(JWT_SECRET);
    expect(output).not.toContain(USER.password);
  });
});
