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

const OTHER_USER = {
  id: "user-2",
  email: "other@example.com",
  password: "hashed-password",
  name: "Other",
  role: "employee",
  organizationId: "org-2",
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

describe("Auth logout revocation (Batch 3B)", () => {
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

  /** Issues a real login pair and returns it with its decoded jti. */
  async function loginPair(user: any = USER) {
    const result = await authService.login({ ...user });
    const decoded = jwtService.verify<{ jti: string }>(result.refresh_token);
    return { ...result, jti: decoded.jti };
  }

  async function rejectionMessage(promise: Promise<unknown>): Promise<string> {
    try {
      await promise;
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      return error.message as string;
    }
    throw new Error("Expected promise to reject, but it resolved");
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
    userStore.set(OTHER_USER.id, { ...OTHER_USER });
    jest.clearAllMocks();
  });

  it("1. valid logout revokes the active refresh token", async () => {
    const issued = await loginPair();
    const result = await authService.logout(issued.refresh_token);

    expect(result).toEqual({ success: true });

    const record = refreshStore.get(issued.jti);
    expect(record?.status).toBe("revoked");
    expect(record?.revokedAt).toBeInstanceOf(Date);
    // Logout revokes; it does not mark the token as used (rotation does that).
    expect(record?.usedAt).toBeNull();
    // History retained: the row still exists with its original identity.
    expect(record?.userId).toBe(USER.id);
    expect(record?.organizationId).toBe(USER.organizationId);
    expect(record?.tokenHash).toBe(sha256Hex(issued.refresh_token));
  });

  it("2. refresh after logout fails", async () => {
    const issued = await loginPair();
    await authService.logout(issued.refresh_token);
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("3. repeated logout is safe and idempotent", async () => {
    const issued = await loginPair();
    const first = await authService.logout(issued.refresh_token);
    const recordAfterFirst = { ...(refreshStore.get(issued.jti) as RefreshRecord) };

    const second = await authService.logout(issued.refresh_token);

    expect(first).toEqual({ success: true });
    expect(second).toEqual({ success: true });

    const record = refreshStore.get(issued.jti);
    expect(record?.status).toBe("revoked");
    expect(record?.revokedAt).toEqual(recordAfterFirst.revokedAt);
    expect(record?.usedAt).toBeNull();
    // No replacement token was created by either logout call.
    expect(refreshStore.size).toBe(1);
  });

  it("4. unknown token/JTI is rejected without leaking existence", async () => {
    const unknown = jwtService.sign(
      {
        sub: USER.id,
        email: USER.email,
        role: USER.role,
        organizationId: USER.organizationId,
        jti: "never-persisted-jti",
        tokenType: "refresh",
        type: "refresh",
      },
      { expiresIn: "7d" },
    );
    const unknownMessage = await rejectionMessage(authService.logout(unknown));
    const malformedMessage = await rejectionMessage(authService.logout("not-a-jwt"));
    expect(unknownMessage).toBe(malformedMessage);
  });

  it("5. malformed token is rejected safely", async () => {
    await expect(authService.logout("not-a-jwt")).rejects.toThrow(UnauthorizedException);
    await expect(authService.logout("a.b.c")).rejects.toThrow(UnauthorizedException);
  });

  it("6. access token supplied to logout is rejected", async () => {
    const issued = await loginPair();
    await expect(authService.logout(issued.access_token)).rejects.toThrow(UnauthorizedException);
    // The persisted refresh record is untouched by the rejected access token.
    expect(refreshStore.get(issued.jti)?.status).toBe("active");
  });

  it("7. hash mismatch is rejected", async () => {
    const issued = await loginPair();
    const record = refreshStore.get(issued.jti);
    expect(record).toBeDefined();
    record!.tokenHash = sha256Hex("some-other-token-value");
    await expect(authService.logout(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
    expect(refreshStore.get(issued.jti)?.status).toBe("active");
  });

  it("8. expired refresh token cannot be used to establish an active session", async () => {
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
    await expect(authService.logout(expired)).rejects.toThrow(UnauthorizedException);
    await expect(authService.refreshToken(expired)).rejects.toThrow(UnauthorizedException);
    expect(refreshStore.size).toBe(0);
  });

  it("9. no cross-user/cross-tenant revocation is possible", async () => {
    const issued = await loginPair(USER);
    // A validly-signed token naming another user/org but carrying USER's jti.
    const forgedForOther = jwtService.sign(
      {
        sub: OTHER_USER.id,
        email: OTHER_USER.email,
        role: OTHER_USER.role,
        organizationId: OTHER_USER.organizationId,
        jti: issued.jti,
        tokenType: "refresh",
        type: "refresh",
      },
      { expiresIn: "7d" },
    );
    await expect(authService.logout(forgedForOther)).rejects.toThrow(UnauthorizedException);
    // The victim's record is untouched and still usable by its rightful owner.
    expect(refreshStore.get(issued.jti)?.status).toBe("active");
    const rotated = await authService.refreshToken(issued.refresh_token);
    expect(rotated.access_token).toBeDefined();
  });

  it("10. no raw token is persisted by logout", async () => {
    const issued = await loginPair();
    refreshTokenCreateMock.mockClear();
    await authService.logout(issued.refresh_token);

    const persistedBlobs = [
      ...refreshTokenCreateMock.mock.calls.map((call) => JSON.stringify(call)),
      ...[...refreshStore.values()].map((record) => JSON.stringify(record)),
    ].join("\n");
    expect(persistedBlobs).not.toContain(issued.refresh_token);
    for (const record of refreshStore.values()) {
      expect(record.tokenHash).not.toBe(issued.refresh_token);
    }
  });

  it("11. logout does not issue a replacement token", async () => {
    const issued = await loginPair();
    const createsBefore = refreshTokenCreateMock.mock.calls.length;
    const result = await authService.logout(issued.refresh_token);

    expect(result).toEqual({ success: true });
    expect((result as Record<string, unknown>).refresh_token).toBeUndefined();
    expect((result as Record<string, unknown>).access_token).toBeUndefined();
    expect(refreshTokenCreateMock.mock.calls.length).toBe(createsBefore);
    expect(refreshStore.size).toBe(1);
  });

  it("12. already revoked token remains revoked", async () => {
    const issued = await loginPair();
    await authService.logout(issued.refresh_token);
    const revokedAt = refreshStore.get(issued.jti)?.revokedAt;

    await authService.logout(issued.refresh_token);

    const record = refreshStore.get(issued.jti);
    expect(record?.status).toBe("revoked");
    expect(record?.revokedAt).toEqual(revokedAt);
    await expect(authService.refreshToken(issued.refresh_token)).rejects.toThrow(UnauthorizedException);
  });

  it("logout via the controller delegates to the service contract", async () => {
    const issued = await loginPair();
    const result = await authController.logout({ refresh_token: issued.refresh_token });
    expect(result).toEqual({ success: true });
    expect(refreshStore.get(issued.jti)?.status).toBe("revoked");
  });

  it("missing/empty token is rejected", async () => {
    await expect(authService.logout("")).rejects.toThrow(UnauthorizedException);
  });
});
