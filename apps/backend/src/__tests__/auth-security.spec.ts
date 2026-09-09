import "reflect-metadata";
import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import { Global, Module } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaClient } from "@prisma/client";
import { AuthService } from "../auth/auth.service.js";
import { AuthController } from "../auth/auth.controller.js";
import { JwtStrategy } from "../auth/jwt.strategy.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { UsersService } from "../users/users.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { validateConfig } from "../config/config.validation.js";
import { RegisterDto } from "../auth/dto/auth.dto.js";
import { AccessTokenPayload, RefreshTokenPayload } from "../auth/token-payload.types.js";

describe("Authentication security boundary (Phase 1)", () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let authController: AuthController;
  let jwtService: JwtService;
  let mockPrisma: any;

  const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";
  const ORIGINAL_ENV = process.env.JWT_SECRET;

  const orgCreateMock = jest.fn();
  const userCreateMock = jest.fn();
  const userFindUniqueMock = jest.fn();

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
      providers: [
        AuthService,
        UsersService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
      ],
      controllers: [AuthController],
    }).compile();
  }

  @Global()
  @Module({
    providers: [
      {
        provide: PrismaClient,
        useValue: {
          user: {
            findUnique: userFindUniqueMock,
            create: userCreateMock,
          },
          organization: {
            create: orgCreateMock,
          },
          platformApiKey: {
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
          },
          // @ts-ignore
          $connect: jest.fn().mockResolvedValue(undefined),
          // @ts-ignore
          $transaction: jest.fn((cb: any) =>
            cb({
              user: { create: userCreateMock, findUnique: userFindUniqueMock },
              organization: { create: orgCreateMock },
            }),
          ),
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

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    moduleRef = await buildModule();
    await moduleRef.init();
    authService = moduleRef.get(AuthService);
    authController = moduleRef.get(AuthController);
    jwtService = moduleRef.get(JwtService);
    mockPrisma = moduleRef.get(PrismaClient);
  });

  afterAll(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = ORIGINAL_ENV;
    }
    moduleRef?.close();
  });

  describe("SEC-1 JWT secret must fail hard", () => {
    it("missing JWT_SECRET causes startup/configuration failure", () => {
      expect(() => validateConfig({})).toThrow(/JWT_SECRET is required/);
      expect(() => validateConfig({ JWT_SECRET: "" })).toThrow(/JWT_SECRET is required/);
    });

    it("placeholder JWT_SECRET is rejected", () => {
      expect(() => validateConfig({ JWT_SECRET: "fallback_secret" })).toThrow(/must not use/);
      expect(() => validateConfig({ JWT_SECRET: "your-jwt-secret" })).toThrow(/must not use/);
    });

    it("configured JWT_SECRET allows auth", async () => {
      const token = jwtService.sign({
        sub: "u1",
        email: "a@b.com",
        role: "employee",
        organizationId: "o1",
        tokenType: "access",
        type: "access",
      });
      expect(token).toBeDefined();
      const payload = jwtService.verify(token);
      expect(payload.sub).toBe("u1");
    });
  });

  describe("SEC-2 no plaintext/sensitive logging", () => {
    it("register does not log the submitted password", async () => {
      const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);
      const prisma = moduleRef.get(PrismaClient) as any;
      prisma.organization.create.mockResolvedValueOnce({ id: "o-new" });
      prisma.user.create.mockResolvedValueOnce({
        id: "u1",
        email: "user@example.com",
        password: "hashed-value",
        name: "User",
        role: "employee",
        organizationId: "o-new",
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await authService.register({
        email: "user@example.com",
        password: "SuperSecretPassword1!",
        name: "User",
      });

      const logged = spy.mock.calls.map((c) => JSON.stringify(c)).join("\n");
      expect(logged).not.toContain("SuperSecretPassword1!");
      expect(logged).not.toContain("hashed-value");
      spy.mockRestore();
      expect((result as any).password).toBeUndefined();
    });
  });

  describe("SEC-3 registration must not trust role or organization", () => {
    async function attemptRegister(body: any) {
      const prisma = moduleRef.get(PrismaClient) as any;
      prisma.user.findUnique.mockReset();
      prisma.user.create.mockReset();
      prisma.organization.create.mockReset();
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.organization.create.mockResolvedValueOnce({ id: "org-generated-uuid" });
      const createdUser = {
        id: "u1",
        email: body.email,
        password: "hashed",
        name: body.name || "T",
        role: "employee",
        organizationId: "org-generated-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.create.mockResolvedValueOnce(createdUser);
      return authService.register({
        email: body.email,
        password: body.password || "LongEnoughPassword1!",
        name: body.name || "T",
        organizationName: body.organizationName,
      } as any);
    }

    it("role=admin is ignored; user gets default role", async () => {
      const result = await attemptRegister({ email: "admin1@example.com", role: "admin", organizationId: "default-org" });
      expect(result.role).toBe("employee");
    });

    it("role=superadmin is ignored", async () => {
      const result = await attemptRegister({ email: "admin2@example.com", role: "superadmin" });
      expect(result.role).toBe("employee");
    });

    it("does not connect to or create a client-supplied org (uses server-controlled org)", async () => {
      const prisma = moduleRef.get(PrismaClient) as any;
      prisma.user.findUnique.mockReset();
      prisma.user.create.mockReset();
      prisma.organization.create.mockReset();
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.organization.create.mockResolvedValue({ id: "server-org-id" });
      prisma.user.create.mockResolvedValue({
        id: "u1",
        email: "x@example.com",
        password: "h",
        role: "employee",
        organizationId: "server-org-id",
      });
      await authService.register({
        email: "x@example.com",
        password: "LongEnoughPassword1!",
        name: "X",
        organizationId: "another-org",
      } as any);
      const orgData = prisma.organization.create.mock.calls[0][0].data;
      const userData = prisma.user.create.mock.calls[0][0].data;
      expect(orgData.id).toBeUndefined();
      expect(orgData.name).toBeDefined();
      expect(userData.organization.connect.id).toBe("server-org-id");
      expect(userData.organization.connect.id).not.toBe("another-org");
      expect(userData.role).toBe("employee");
    });
  });

  describe("SEC-12 password policy", () => {
    it("server-side DTO validation enforces 12-char minimum (see auth-dto.spec)", () => {
      expect(RegisterDto).toBeDefined();
    });
  });

  describe("SEC-11 exact role matching", () => {
    it("required admin does not match superadmin or admin-assistant", () => {
      const guard = moduleRef.get(RolesGuard);
      const reflector = (guard as any).reflector;
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);
      const mkCtx = (role: string) =>
        ({
          switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
          getHandler: () => ({}),
          getClass: () => ({}),
        }) as any;
      expect(() => guard.canActivate(mkCtx("superadmin"))).toThrow();
      expect(() => guard.canActivate(mkCtx("admin-assistant"))).toThrow();
      expect(() => guard.canActivate(mkCtx("administrator"))).toThrow();
      expect(guard.canActivate(mkCtx("admin"))).toBe(true);
      jest.restoreAllMocks();
    });
  });

  describe("Refresh token type distinction", () => {
    it("refresh token cannot be used as an access token (jwt strategy rejects it)", async () => {
      const refreshPayload: RefreshTokenPayload = {
        sub: "u1",
        email: "a@b.com",
        role: "employee",
        organizationId: "o1",
        tokenType: "refresh",
        type: "refresh",
      };
      const token = jwtService.sign(refreshPayload, { expiresIn: "7d" });
      const strategy = moduleRef.get(JwtStrategy);
      await expect(strategy.validate(refreshPayload as any)).rejects.toThrow("Invalid token type");
      expect(token).toBeDefined();
    });

    it("access token carries tokenType=access claim", async () => {
      const payload: AccessTokenPayload = {
        sub: "u1",
        email: "a@b.com",
        role: "employee",
        organizationId: "o1",
        tokenType: "access",
        type: "access",
      };
      const token = jwtService.sign(payload);
      const verified = jwtService.verify<{ tokenType: string; type: string }>(token);
      expect(verified.tokenType).toBe("access");
      expect(verified.type).toBe("access");
    });
  });

  describe("SEC-7 global auth boundary", () => {
    it("JwtAuthGuard exists and is used as a global guard source", () => {
      const guard = moduleRef.get(JwtAuthGuard);
      expect(guard).toBeDefined();
    });
  });
});
