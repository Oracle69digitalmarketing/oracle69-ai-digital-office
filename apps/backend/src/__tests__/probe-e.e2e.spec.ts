import "reflect-metadata";
import { describe, it, beforeAll, afterAll } from "@jest/globals";
import { INestApplication, Module, Global, ValidationPipe } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import * as http from "http";

import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { JwtStrategy } from "../auth/jwt.strategy.js";
import { validateConfig } from "../config/config.validation.js";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter.js";
import { TenantContextInterceptor } from "../common/interceptors/tenant-context.interceptor.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { WorkflowsModule } from "../workflows/workflows.module.js";
import { RuntimeModule } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = "probe-jwt-secret-at-least-32-chars-000000";
process.env.JWT_SECRET = JWT_SECRET;
process.env.ENCRYPTION_KEY = "probe-encryption-key-must-not-be-default-1234";

const ORG_A = "org-a";
const ORG_B = "org-b";
const PROJ_A = "proj-a";
const PROJ_B = "proj-b";
const WF_A = "wf-a";
const WF_B = "wf-b";

function buildPrismaMock() {
  const projects: Record<string, any> = {
    [PROJ_A]: { id: PROJ_A, organizationId: ORG_A },
    [PROJ_B]: { id: PROJ_B, organizationId: ORG_B },
  };
  const workflows: Record<string, any> = {
    [WF_A]: { id: WF_A, name: "Org A Workflow", status: "not_started", projectId: PROJ_A, project: projects[PROJ_A], createdAt: new Date(), completedAt: null },
    [WF_B]: { id: WF_B, name: "Org B Workflow", status: "not_started", projectId: PROJ_B, project: projects[PROJ_B], createdAt: new Date(), completedAt: null },
  };
  return {
    project: { findUnique: async ({ where }: any) => projects[where.id] ?? null },
    workflow: {
      findUnique: async ({ where, include }: any) => {
        const wf = workflows[where.id];
        return wf ? (include?.project ? { ...wf, project: { ...wf.project } } : { ...wf }) : null;
      },
    },
    task: { findUnique: async () => null },
    memory: { create: async ({ data }: any) => ({ id: "mem-1", ...data }), findMany: async () => [] },
  };
}

const PRISMA_MOCK = buildPrismaMock();

@Global()
@Module({
  providers: [{ provide: PrismaClient, useValue: PRISMA_MOCK }],
  exports: [PrismaClient],
})
class GlobalProbePrismaModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({ secret: cs.getOrThrow<string>("JWT_SECRET"), signOptions: { expiresIn: "1h", algorithm: "HS256" } }),
      inject: [ConfigService],
    }),
    RuntimeModule,
    PrismaModule,
    GlobalProbePrismaModule,
    WorkflowsModule,
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    Reflector,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: PrismaService, useValue: PRISMA_MOCK },
  ],
})
class ProbeEModule {}

describe("probe E", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let server: http.Server;
  let port: number;
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({ imports: [ProbeEModule] })
      .overrideProvider(PrismaService)
      .useValue(PRISMA_MOCK)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    server = app.getHttpServer();
    await new Promise<void>((resolve) => { server.listen(0, resolve); });
    port = (server.address() as any).port;
    jwtService = moduleRef.get(JwtService);
  }, 60000);
  afterAll(async () => { await app?.close(); delete process.env.JWT_SECRET; delete process.env.ENCRYPTION_KEY; });

  function request(path: string, opts: { token?: string; method?: string; body?: any } = {}): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port, path, method: opts.method || "GET", headers: opts.body ? { "Content-Type": "application/json" } : undefined }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { let body: any = data; try { body = JSON.parse(data); } catch {} resolve({ status: res.statusCode as number, body }); });
      });
      if (opts.token) req.setHeader("Authorization", `Bearer ${opts.token}`);
      if (opts.body) req.write(JSON.stringify(opts.body));
      req.on("error", reject);
      req.end();
    });
  }
  function signAccess(organizationId: string) {
    return jwtService.sign({ sub: "user-1", email: "u@org.com", role: "employee", organizationId, tokenType: "access", type: "access" });
  }

  it("E prints response for client-supplied orgId", async () => {
    const r1 = await request(`/workflows/${WF_B}`, { token: signAccess(ORG_A), body: { organizationId: ORG_B } });
    const r1h = await new Promise<any>((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port, path: `/workflows/${WF_B}`, method: "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${signAccess(ORG_A)}` } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, data }));
      });
      req.setHeader("Content-Type", "application/json");
      req.write(JSON.stringify({ organizationId: ORG_B }));
      req.on("error", reject);
      req.end();
    });
    console.log("E RAW headers:", JSON.stringify(r1h.headers));
    console.log("E RAW data:", JSON.stringify(r1h.data));
    console.log("E GET+body status:", r1.status, "body:", JSON.stringify(r1.body));
    const r2 = await request(`/workflows/${WF_B}?organizationId=${ORG_B}`, { token: signAccess(ORG_A) });
    // control: same client pattern against a trivial plain-http echo server
    const echo = http.createServer((req, res) => {
      let d = "";
      req.on("data", (c) => (d += c));
      req.on("end", () => { res.writeHead(200, { "Content-Type": "text/plain" }); res.end("echo:" + req.method + ":" + d); });
    });
    await new Promise<void>((r) => { echo.listen(0, r); });
    const eport = (echo.address() as any).port;
    const echoRes = await new Promise<any>((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port: eport, path: `/hello`, method: "GET", headers: { "Content-Type": "application/json", Authorization: "Bearer abc.def.ghi" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      });
      req.write(JSON.stringify({ organizationId: "org-b" }));
      req.on("error", reject);
      req.end();
    });
    echo.close();
    console.log("CONTROL echo:", echoRes.status, JSON.stringify(echoRes.data));
    console.log("E GET+query status:", r2.status, "body:", JSON.stringify(r2.body));
    const r3 = await request(`/workflows/${WF_A}`, { token: signAccess(ORG_A) });
    console.log("A GET own status:", r3.status, "body:", JSON.stringify(r3.body).slice(0, 120));
  });
});
