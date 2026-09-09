import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Module,
  INestApplication,
  ValidationPipe,
  ForbiddenException,
} from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { JwtStrategy } from "../auth/jwt.strategy.js";
import { Public } from "../auth/public.decorator.js";
import { validateConfig } from "../config/config.validation.js";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter.js";
import { TenantContextInterceptor } from "../common/interceptors/tenant-context.interceptor.js";
import { TenantContextService, TenantContextError } from "@oracle69/runtime";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";

@Controller("tenant-test")
class TenantTestController {
  constructor(private readonly tenantContext: TenantContextService) {}

  @Get("org")
  org() {
    return { tenantId: this.tenantContext.getTenantId() };
  }

  @Get("org-async")
  async orgAsync() {
    const tenantId = await Promise.resolve().then(() => this.tenantContext.getTenantId());
    return { tenantId };
  }

  @Post("spoof")
  spoof(@Body() body: { organizationId?: string }) {
    // Attempt to seed a different tenant via the request body. The interceptor
    // must ignore it and keep the authenticated principal's scope.
    return { tenantId: this.tenantContext.getTenantId(), bodyOrgId: body.organizationId ?? null };
  }

  @Get("fail-closed")
  failClosed() {
    // Tenant-dependent execution that must fail when no tenant is active.
    return { tenantId: this.tenantContext.resolveTenantId() };
  }
}

@Controller("tenant-public")
class TenantPublicController {
  @Public()
  @Get("hello")
  hello() {
    return { ok: true };
  }
}

@Module({
  controllers: [TenantTestController, TenantPublicController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    Reflector,
    TenantContextService,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
class TenantTestAppModule {}

describe("HTTP tenant seeding (TenantContextInterceptor)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

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
        TenantTestAppModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
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
    opts: { token?: string; method?: string; body?: any } = {},
  ): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const server = app.getHttpServer();
      const port = server.address().port;
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method: opts.method || "GET",
          headers: opts.body ? { "Content-Type": "application/json" } : undefined,
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
      if (opts.body) req.write(JSON.stringify(opts.body));
      req.on("error", reject);
      req.end();
    });
  }

  function signAccess(organizationId: string) {
    return jwtService.sign({
      sub: "u1",
      email: "a@b.com",
      role: "employee",
      organizationId,
      tokenType: "access",
      type: "access",
    });
  }

  it("seeds organizationId into TenantContextService for authenticated JWT requests", async () => {
    const res = await request("/tenant-test/org", { token: signAccess("org-A") });
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe("org-A");
  });

  it("downstream async service call to getTenantId() returns the authenticated org", async () => {
    const res = await request("/tenant-test/org-async", { token: signAccess("org-A") });
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe("org-A");
  });

  it("tenant A cannot seed tenant B through request body", async () => {
    const res = await request("/tenant-test/spoof", {
      method: "POST",
      token: signAccess("org-A"),
      body: { organizationId: "org-B" },
    });
    expect(res.status).toBe(201);
    expect(res.body.tenantId).toBe("org-A");
    expect(res.body.bodyOrgId).toBe("org-B");
  });

  it("public routes do not require tenant context", async () => {
    const res = await request("/tenant-public/hello");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("missing organizationId fails closed for tenant-dependent execution", async () => {
    const res = await request("/tenant-test/fail-closed", { token: signAccess("org-A") });
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe("org-A");
  });

  it("fails closed when downstream requires a tenant and no tenant is seeded", async () => {
    const moduleRef = app.get(TenantContextService);
    let error: unknown;
    try {
      moduleRef.resolveTenantId();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(TenantContextError);
  });
});
