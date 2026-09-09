import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  Controller,
  Get,
  Module,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { JwtStrategy } from "../auth/jwt.strategy.js";
import { Public } from "../auth/public.decorator.js";
import { validateConfig } from "../config/config.validation.js";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter.js";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";

@Controller("test")
class TestController {
  @Get("protected")
  protected() {
    return { ok: true };
  }

  @Public()
  @Get("public")
  publicEndpoint() {
    return { ok: true };
  }
}

@Module({
  controllers: [TestController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    Reflector,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
})
class TestAppModule {}

describe("Global authentication boundary (SEC-7)", () => {
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
        TestAppModule,
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

  function request(path: string, token?: string): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const server = app.getHttpServer();
      const port = server.address().port;
      const req = http.request(
        { host: "127.0.0.1", port, path, method: "GET" },
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
      if (token) req.setHeader("Authorization", `Bearer ${token}`);
      req.on("error", reject);
      req.end();
    });
  }

  function signAccess() {
    return jwtService.sign({
      sub: "u1",
      email: "a@b.com",
      role: "employee",
      organizationId: "o1",
      tokenType: "access",
      type: "access",
    });
  }

  it("protected endpoint without token => 401", async () => {
    const res = await request("/test/protected");
    expect(res.status).toBe(401);
  });

  it("protected endpoint with invalid token => 401", async () => {
    const res = await request("/test/protected", "invalid.token.here");
    expect(res.status).toBe(401);
  });

  it("protected endpoint with valid token reaches the endpoint", async () => {
    const res = await request("/test/protected", signAccess());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("@Public endpoint remains accessible without JWT", async () => {
    const res = await request("/test/public");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
