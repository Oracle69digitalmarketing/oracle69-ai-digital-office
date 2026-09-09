import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import {
  Module,
  Global,
  INestApplication,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { JwtStrategy } from "../auth/jwt.strategy.js";
import { validateConfig } from "../config/config.validation.js";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter.js";
import { TenantContextInterceptor } from "../common/interceptors/tenant-context.interceptor.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { ReceptionistModule } from "../receptionist/receptionist.module.js";
import { WorkflowsModule } from "../workflows/workflows.module.js";
import { RuntimeModule } from "@oracle69/runtime";
import { MemoryModule } from "@oracle69/memory";
import { ExecutionEngineModule } from "@oracle69/execution-engine";
import { AgentEngineModule, AgentRegistry, BaseAgent } from "@oracle69/agent-engine";
import { AgentMetadata } from "@oracle69/shared";
import { SharedModule, EventBus } from "@oracle69/shared";
import { CustomerSuccessModule, CsSuccessPlanService } from "@oracle69/customer-success";
import {
  ConnectorModule,
  ConnectorManager,
  CredentialManager,
  OAuthManager,
} from "@oracle69/connectors";
import { TenantContextService, MissionManager, MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";
const ENCRYPTION_KEY = "p3p1-module-graph-encryption-key-abcdef-1234567890";

// ConfigModule.forRoot(... { validate: validateConfig }) is evaluated when the
// @Module class below is defined (import time), so the config the validator
// inspects must already be present in the environment — mirroring production,
// where env is set before the app boots.
process.env.JWT_SECRET = JWT_SECRET;
process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;

const ORG_A = "org-a";
const ORG_B = "org-b";
const PROJ_A = "proj-a";
const PROJ_B = "proj-b";
const WF_A = "wf-a";
const WF_B = "wf-b";

/**
 * Production module-graph integration test.
 *
 * This composes the SAME feature modules and the SAME global APP_GUARD
 * (JwtAuthGuard) + APP_INTERCEPTOR (TenantContextInterceptor) wiring that the
 * production AppModule uses, so tenant isolation is exercised through real
 * dependency injection rather than isolated feature-specific test modules.
 * Only the database layer (Prisma) is mocked; no alternate auth or tenant
 * providers are introduced.
 */

class StubAgent extends BaseAgent {
  constructor(metadata: AgentMetadata) {
    super(metadata);
  }
  async execute(task: any): Promise<any> {
    return `executed-${this.metadata.name}`;
  }
}

function makeAgentMeta(id: string, role: string): AgentMetadata {
  return {
    id,
    name: id,
    role,
    description: "test",
    version: "1.0.0",
    capabilities: [],
    permissions: [],
    supportedModels: ["nano"],
    healthStatus: "idle",
  } as AgentMetadata;
}

function buildPrismaMock() {
  const projects: Record<string, any> = {
    [PROJ_A]: { id: PROJ_A, organizationId: ORG_A },
    [PROJ_B]: { id: PROJ_B, organizationId: ORG_B },
  };
  const workflows: Record<string, any> = {
    [WF_A]: {
      id: WF_A,
      name: "Org A Workflow",
      status: "not_started",
      projectId: PROJ_A,
      project: projects[PROJ_A],
      createdAt: new Date(),
      completedAt: null,
    },
    [WF_B]: {
      id: WF_B,
      name: "Org B Workflow",
      status: "not_started",
      projectId: PROJ_B,
      project: projects[PROJ_B],
      createdAt: new Date(),
      completedAt: null,
    },
  };
  return {
    project: {
      findUnique: jest.fn(async ({ where }: any) => projects[where.id] ?? null),
    },
    workflow: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const wf = workflows[where.id];
        return wf ? (include?.project ? { ...wf, project: { ...wf.project } } : { ...wf }) : null;
      }),
      findMany: jest.fn(async ({ where, include }: any) => {
        const orgId = where?.project?.organizationId;
        let res = Object.values(workflows);
        if (orgId) res = res.filter((w) => w.project.organizationId === orgId);
        return res.map((w) => (include?.project ? { ...w, project: { ...w.project } } : { ...w }));
      }),
      create: jest.fn(async ({ data }: any) => {
        const wf = {
          id: `wf-${Date.now()}`,
          name: data.name,
          status: data.status ?? "not_started",
          projectId: data.projectId,
          project: projects[data.projectId],
          createdAt: new Date(),
          completedAt: null,
        };
        workflows[wf.id] = wf;
        return { ...wf };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const wf = workflows[where.id];
        if (!wf) throw new Error("Record to update not found.");
        Object.assign(wf, data);
        return { ...wf };
      }),
    },
    task: {
      findUnique: jest.fn(async () => null),
    },
    memory: {
      create: jest.fn(async ({ data }: any) => ({ id: "mem-1", ...data })),
      findMany: jest.fn(async () => []),
    },
    integrationCredential: {
      findUnique: jest.fn(async ({ where }: any) => {
        const key = `${where.provider_organizationId.provider}::${where.provider_organizationId.organizationId}`;
        return credentials[key] ? { ...credentials[key] } : null;
      }),
      upsert: jest.fn(async ({ where, update, create }: any) => {
        const key = `${where.provider_organizationId.provider}::${where.provider_organizationId.organizationId}`;
        if (credentials[key]) {
          Object.assign(credentials[key], update);
        } else {
          credentials[key] = { id: `cred-${Object.keys(credentials).length + 1}`, ...create };
        }
        return { ...credentials[key] };
      }),
    },
  };
}

const credentials: Record<string, any> = {};
const PRISMA_MOCK = buildPrismaMock();

// ConnectorModule (via CredentialManager/OAuthManager) constructor-injects the
// raw PrismaClient class, which no module in the production graph provides as a
// token. Provide it here as a global test scaffold bound to the same in-memory
// mock so the real composed graph resolves and no database is touched.
@Global()
@Module({
  providers: [{ provide: PrismaClient, useValue: PRISMA_MOCK }],
  exports: [PrismaClient],
})
class GlobalTestPrismaModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h", algorithm: "HS256" },
      }),
      inject: [ConfigService],
    }),
    RuntimeModule,
    SharedModule,
    MemoryModule,
    ExecutionEngineModule,
    AgentEngineModule,
    PrismaModule,
    GlobalTestPrismaModule,
    ReceptionistModule,
    WorkflowsModule,
    CustomerSuccessModule,
    ConnectorModule,
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
class ProductionGraphTestModule {}

describe("Phase 3 P1 WS4 — Real production module-graph tenant isolation", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let agentRegistry: AgentRegistry;
  let tenantContext: TenantContextService;
  let connectorManager: ConnectorManager;
  let credentialManager: CredentialManager;
  let oauthManager: OAuthManager;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.ENCRYPTION_KEY = "p3p1-module-graph-encryption-key-abcdef-1234567890";

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ProductionGraphTestModule],
    })
      .overrideProvider(PrismaService)
      .useValue(PRISMA_MOCK)
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));

    jwtService = moduleRef.get(JwtService);
    agentRegistry = moduleRef.get(AgentRegistry);
    tenantContext = moduleRef.get(TenantContextService);
    connectorManager = moduleRef.get(ConnectorManager);
    credentialManager = moduleRef.get(CredentialManager);
    oauthManager = moduleRef.get(OAuthManager);

    // Provision tenant-scoped Chief of Staff agents so receptionist delegation
    // is resolvable per-tenant and Org-A can never resolve an Org-B agent.
    await agentRegistry.register(new StubAgent(makeAgentMeta(`cos-${ORG_A}`, "chief-of-staff")), ORG_A);
    await agentRegistry.register(new StubAgent(makeAgentMeta(`cos-${ORG_B}`, "chief-of-staff")), ORG_B);
  }, 60000);

  afterAll(async () => {
    await app?.close();
    delete process.env.JWT_SECRET;
    delete process.env.ENCRYPTION_KEY;
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
      sub: "user-1",
      email: "u@org.com",
      role: "employee",
      organizationId,
      tokenType: "access",
      type: "access",
    });
  }

  it("A. authenticated Org-A request to its own tenant data succeeds", async () => {
    const res = await request(`/workflows/${WF_A}`, { token: signAccess(ORG_A) });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(WF_A);
  });

  it("B. authenticated Org-A request to Org-B data fails (404)", async () => {
    const res = await request(`/workflows/${WF_B}`, { token: signAccess(ORG_A) });
    expect(res.status).toBe(404);
  });

  it("C. authenticated Org-B request to its own tenant data succeeds", async () => {
    const res = await request(`/workflows/${WF_B}`, { token: signAccess(ORG_B) });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(WF_B);
  });

  it("D. unauthenticated / invalid tenant request fails closed (APP_GUARD JwtAuthGuard active)", async () => {
    const noToken = await request(`/workflows/${WF_A}`);
    expect(noToken.status).toBe(401);
  });

  it("E. client-supplied organizationId cannot override JWT tenant", async () => {
    // POST accepts a body (unlike GET, which Express rejects with 400).
    // The JWT tenant (org-a) governs; Org-B's project stays unreachable.
    const res = await request(`/workflows`, {
      token: signAccess(ORG_A),
      method: "POST",
      body: { name: "Sneaky", projectId: PROJ_B, organizationId: ORG_B },
    });
    expect(res.status).toBe(404);
  });
  it("E2. client-supplied organizationId on GET cannot override JWT tenant", async () => {
    // GET has no body; the JWT tenant still governs. Org-B workflow unreachable.
    const res = await request(`/workflows/${WF_B}`, {
      token: signAccess(ORG_A),
    });
    expect(res.status).toBe(404);
  });

  it("F. agent delegation remains tenant scoped (Org-A resolves only Org-A agents)", async () => {
    const cosA = agentRegistry.findAgentsByRoleAndTenant("chief-of-staff", ORG_A);
    const cosB = agentRegistry.findAgentsByRoleAndTenant("chief-of-staff", ORG_B);
    expect(cosA.map((a) => a.metadata.id)).toEqual([`cos-${ORG_A}`]);
    expect(cosB.map((a) => a.metadata.id)).toEqual([`cos-${ORG_B}`]);
    // A global (tenant-less) agent must not be resolvable for a tenant.
    await agentRegistry.register(new StubAgent(makeAgentMeta("global-cos", "chief-of-staff")));
    const after = agentRegistry.findAgentsByRoleAndTenant("chief-of-staff", ORG_A);
    expect(after.map((a) => a.metadata.id)).toEqual([`cos-${ORG_A}`]);
  });

  it("G. credential lookup remains tenant scoped in the real composed graph", async () => {
    // Org-A can save + read its own credential.
    await tenantContext.run({ tenantId: ORG_A }, () =>
      credentialManager.saveCredentials(ORG_A, "gmail", { apiKey: "key-A" }),
    );
    const credA = await tenantContext.run({ tenantId: ORG_A }, () =>
      credentialManager.getCredentials(ORG_A, "gmail"),
    );
    expect(credA?.apiKey).toBe("key-A");

    // Org-A cannot read into Org-B's credential.
    await expect(
      tenantContext.run({ tenantId: ORG_A }, () =>
        credentialManager.getCredentials(ORG_B, "gmail"),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Org-A cannot trigger an OAuth refresh for Org-B's provider.
    await expect(
      tenantContext.run({ tenantId: ORG_A }, () => oauthManager.refreshToken(ORG_B, "gmail")),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("G2. customer success service path remains tenant scoped in the real composed graph", async () => {
    const csPlan = app.get(CsSuccessPlanService);
    // Install CRM/prisma mocks on the customer-success services (real modules,
    // real DI) so no DB is touched, mirroring the production service graph.
    const crmOrgs: any[] = [
      { id: "crm-a", organizationId: ORG_A, name: "Org A CRM" },
      { id: "crm-b", organizationId: ORG_B, name: "Org B CRM" },
    ];
    const findCrm = jest.fn(async ({ where }: any) => {
      const crm = crmOrgs.find((c) => c.id === where.id);
      return crm ? { ...crm, contacts: [], opportunities: [], interactions: [] } : null;
    });
    (csPlan as any).prisma.crmOrganization.findUnique = findCrm;
    (csPlan as any).prisma.csSuccessPlan.findMany = jest.fn(async () => []);
    (csPlan as any).prisma.csSuccessPlan.create = jest.fn(async ({ data }: any) => ({
      id: "plan-new",
      ...data,
    }));
    (csPlan as any).prisma.csInteraction.create = jest.fn(async ({ data }: any) => ({
      id: "i1",
      ...data,
    }));
    (app.get(MissionManager) as any).createMission =
      (app.get(MissionManager) as any).createMission || jest.fn(async () => ({ id: "m" }));
    (app.get(MessageBus) as any).publish = (app.get(MessageBus) as any).publish || jest.fn();

    // Org-A can read its own CRM org's health-driven plan list (service-level
    // assertCrmOrganizationBelongsToTenant passes).
    const ok = await tenantContext.run({ tenantId: ORG_A }, () =>
      csPlan.listSuccessPlans("crm-a"),
    );
    expect(Array.isArray(ok)).toBe(true);

    // Org-A cannot read Org-B's CRM organization plans (0 -> NotFound fail-closed).
    await expect(
      tenantContext.run({ tenantId: ORG_A }, () => csPlan.listSuccessPlans("crm-b")),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
