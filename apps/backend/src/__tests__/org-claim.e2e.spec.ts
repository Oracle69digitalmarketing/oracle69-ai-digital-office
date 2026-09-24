import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  Controller,
  Get,
  Post,
  Module,
  INestApplication,
  UseGuards,
} from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { OrgClaimGuard } from "@oracle69/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { JwtStrategy } from "../auth/jwt.strategy.js";
import { validateConfig } from "../config/config.validation.js";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter.js";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";

@Controller("finance")
@UseGuards(OrgClaimGuard)
class FinanceTestController {
  @Get(":organizationId/kpis")
  kpis() {
    return { ok: true };
  }
}

@Controller("hr")
@UseGuards(OrgClaimGuard)
class HrTestController {
  @Get(":organizationId/kpis")
  kpis() {
    return { ok: true };
  }
}

@Controller("knowledge")
@UseGuards(OrgClaimGuard)
class KnowledgeTestController {
  @Get(":organizationId/kpis")
  kpis() {
    return { ok: true };
  }
}

@Controller("enterprise-intelligence")
@UseGuards(OrgClaimGuard)
class EiTestController {
  @Get("kpis/:organizationId")
  kpis() {
    return { ok: true };
  }
}

@Module({
  controllers: [
    FinanceTestController,
    HrTestController,
    KnowledgeTestController,
    EiTestController,
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    Reflector,
    OrgClaimGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
})
class OrgClaimTestAppModule {}

describe("organizationId claim authorization (Phase 2 Step 2)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const ROUTES = [
    "/finance/org-a/kpis",
    "/hr/org-a/kpis",
    "/knowledge/org-a/kpis",
    "/enterprise-intelligence/kpis/org-a",
  ];

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    const moduleRef: TestingModule = await Test.createTestingModule({
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
        OrgClaimTestAppModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
    delete process.env.JWT_SECRET;
  });

  function request(
    path: string,
    opts: { token?: string } = {},
  ): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const server = app.getHttpServer();
      const port = server.address().port;
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method: "GET",
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            let body: any = data;
            try {
              body = JSON.parse(data);
            } catch {}
            resolve({ status: res.statusCode as number, body });
          });
        },
      );
      if (opts.token) req.setHeader("Authorization", `Bearer ${opts.token}`);
      req.on("error", reject);
      req.end();
    });
  }

  function signAccess(claims: {
    organizationId?: string;
    tokenType?: string;
  }): string {
    return jwtService.sign({
      sub: "u1",
      email: "a@b.com",
      role: "employee",
      organizationId: claims.organizationId,
      tokenType: claims.tokenType ?? "access",
      type: "access",
    });
  }

  it("unauthenticated access to every guarded route stays a 401", async () => {
    for (const route of ROUTES) {
      const res = await request(route);
      expect(res.status).toBe(401);
    }
  });

  it("same-tenant access to every guarded route succeeds (200)", async () => {
    const token = signAccess({ organizationId: "org-a" });
    for (const route of ROUTES) {
      const res = await request(route, { token });
      expect(res.status).toBe(200);
    }
  });

  it("cross-tenant access (claim org-a, resource org-b) is forbidden (403)", async () => {
    const token = signAccess({ organizationId: "org-a" });
    const routes = ROUTES.map((route) => route.replace("org-a", "org-b"));
    for (const route of routes) {
      const res = await request(route, { token });
      expect(res.status).toBe(403);
    }
  });

  it("a token without an organizationId claim is rejected at the auth boundary (401)", async () => {
    // JwtStrategy now rejects access tokens that lack a valid organizationId
    // before OrgClaimGuard ever runs (fail-closed at authentication rather
    // than authorization). The token never reaches the guarded routes.
    const token = signAccess({ organizationId: undefined });
    for (const route of ROUTES) {
      const res = await request(route, { token });
      expect(res.status).toBe(401);
    }
  });

  it("a refresh token is never accepted as an access token (401)", async () => {
    const token = signAccess({ organizationId: "org-a", tokenType: "refresh" });
    for (const route of ROUTES) {
      const res = await request(route, { token });
      expect(res.status).toBe(401);
    }
  });

  it("errors carry a normalized 403 response for mismatched claims", async () => {
    const token = signAccess({ organizationId: "org-a" });
    const res = await request("/finance/org-b/kpis", { token });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("statusCode", 403);
    expect(res.body.message).toContain("forbidden");
  });
});
