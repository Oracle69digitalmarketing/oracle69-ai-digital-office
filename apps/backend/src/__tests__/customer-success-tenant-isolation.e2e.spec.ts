import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { Module, INestApplication, ValidationPipe } from "@nestjs/common";
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
import {
  TenantContextService,
  MessageBus,
  MissionManager,
} from "@oracle69/runtime";
import {
  CustomerSuccessController,
  CsHealthEngine,
  CsRiskEngine,
  CsSuccessPlanService,
} from "@oracle69/customer-success";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";

const ORG_A = "org-a";
const ORG_B = "org-b";
const CRM_A = "crm-a";
const CRM_B = "crm-b";

describe("Phase 2 Step 4 — Customer Success tenant isolation", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const crmOrgs: any[] = [
    {
      id: CRM_A,
      organizationId: ORG_A,
      name: "Org A CRM",
      contacts: [],
      opportunities: [],
      interactions: [],
    },
    {
      id: CRM_B,
      organizationId: ORG_B,
      name: "Org B CRM",
      contacts: [],
      opportunities: [],
      interactions: [],
    },
  ];

  const plans: any[] = [
    {
      id: "plan-b",
      name: "Org B Plan",
      crmOrganizationId: CRM_B,
      milestones: [
        { id: "ms-b-1", name: "Org B milestone", status: "pending", dueDate: new Date() },
      ],
    },
  ];

  const healthScores: any[] = [];
  const churnRisks: any[] = [];
  const interactions: any[] = [];

  function installPrismaMocks() {
    const healthPrisma = (app.get(CsHealthEngine) as any).prisma;
    const riskPrisma = (app.get(CsRiskEngine) as any).prisma;
    const planPrisma = (app.get(CsSuccessPlanService) as any).prisma;

    healthPrisma.crmOrganization.findUnique = jest.fn(async ({ where }: any) => {
      const org = crmOrgs.find((o) => o.id === where.id);
      return org ? { ...org } : null;
    });
    healthPrisma.crmOrganization.update = jest.fn(async ({ where, data }: any) => {
      const org = crmOrgs.find((o) => o.id === where.id);
      if (org) Object.assign(org, data);
      return org;
    });
    healthPrisma.csHealthScore.findFirst = jest.fn(async () => null);
    healthPrisma.csHealthScore.create = jest.fn(async ({ data }: any) => {
      const created = { id: `score-${healthScores.length + 1}`, ...data };
      healthScores.push(created);
      return created;
    });

    riskPrisma.crmOrganization.findUnique = healthPrisma.crmOrganization.findUnique;
    riskPrisma.csChurnRisk.createMany = jest.fn(async ({ data }: any) => {
      churnRisks.push(...data);
      return { count: data.length };
    });

    planPrisma.crmOrganization.findUnique = healthPrisma.crmOrganization.findUnique;
    planPrisma.csSuccessPlan.create = jest.fn(async ({ data, include }: any) => {
      const createdMilestones =
        data.milestones?.create?.map((m: any, idx: number) => ({
          id: `ms-${plans.length}-${idx}`,
          ...m,
          status: "pending",
        })) ?? [];
      const created = {
        id: `plan-${plans.length + 1}`,
        name: data.name,
        crmOrganizationId: data.crmOrganizationId,
        milestones: createdMilestones,
      };
      plans.push(created);
      return include ? created : { id: created.id };
    });
    planPrisma.csSuccessPlan.findMany = jest.fn(async ({ where, include }: any) => {
      return plans
        .filter((p) => p.crmOrganizationId === where.crmOrganizationId)
        .map((p) => (include ? { ...p } : p));
    });
    planPrisma.csSuccessPlanMilestone.findUnique = jest.fn(async ({ where }: any) => {
      for (const plan of plans) {
        const milestone = plan.milestones.find((m: any) => m.id === where.id);
        if (milestone) {
          const crmOrg = crmOrgs.find((o) => o.id === plan.crmOrganizationId);
          return {
            ...milestone,
            successPlan: { ...plan, crmOrganization: { organizationId: crmOrg.organizationId } },
          };
        }
      }
      return null;
    });
    planPrisma.csSuccessPlanMilestone.update = jest.fn(async ({ where, data, include }: any) => {
      for (const plan of plans) {
        const milestone = plan.milestones.find((m: any) => m.id === where.id);
        if (milestone) {
          Object.assign(milestone, data);
          return include ? { ...milestone, successPlan: plan } : milestone;
        }
      }
      throw new Error("Record to update not found.");
    });
    planPrisma.csInteraction.create = jest.fn(async ({ data }: any) => {
      const created = { id: `interaction-${interactions.length + 1}`, ...data };
      interactions.push(created);
      return created;
    });
  }

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
      ],
      controllers: [CustomerSuccessController],
      providers: [
        CsHealthEngine,
        CsRiskEngine,
        CsSuccessPlanService,
        {
          provide: MessageBus,
          useValue: { publish: jest.fn() },
        },
        {
          provide: MissionManager,
          useValue: { createMission: jest.fn(async () => ({ id: "mission-mock" })) },
        },
        TenantContextService,
        JwtStrategy,
        JwtAuthGuard,
        Reflector,
        { provide: APP_GUARD, useExisting: JwtAuthGuard },
        { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    jwtService = moduleRef.get(JwtService);
    installPrismaMocks();
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
      sub: "user-a",
      email: "a@orga.com",
      role: "employee",
      organizationId,
      tokenType: "access",
      type: "access",
    });
  }

  it("Org-A can access its own CRM organization health", async () => {
    const res = await request(`/customer-success/health/${CRM_A}`, {
      token: signAccess(ORG_A),
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.score).toBe("number");
  });

  it("Org-A cannot access Org-B health (404)", async () => {
    const res = await request(`/customer-success/health/${CRM_B}`, {
      token: signAccess(ORG_A),
    });
    expect(res.status).toBe(404);
  });

  it("Org-A cannot read Org-B success plans (404)", async () => {
    const res = await request(`/customer-success/plans/${CRM_B}`, {
      token: signAccess(ORG_A),
    });
    expect(res.status).toBe(404);
  });

  it("Org-A cannot create a success plan for Org-B (404)", async () => {
    const res = await request(`/customer-success/plans/${CRM_B}`, {
      method: "POST",
      token: signAccess(ORG_A),
      body: { name: "Sneaky Plan" },
    });
    expect(res.status).toBe(404);
  });

  it("Org-A cannot trigger an intervention for Org-B (404)", async () => {
    const res = await request(`/customer-success/interventions/${CRM_B}`, {
      method: "POST",
      token: signAccess(ORG_A),
      body: { action: "Call the customer" },
    });
    expect(res.status).toBe(404);
  });

  it("Org-A cannot complete Org-B milestone by ID (404, IDOR)", async () => {
    const res = await request(`/customer-success/plans/milestones/ms-b-1/complete`, {
      method: "POST",
      token: signAccess(ORG_A),
    });
    expect(res.status).toBe(404);
  });

  it("Org-B can access its own CRM organization health", async () => {
    const res = await request(`/customer-success/health/${CRM_B}`, {
      token: signAccess(ORG_B),
    });
    expect(res.status).toBe(200);
  });

  it("Org-B can read its own success plans", async () => {
    const res = await request(`/customer-success/plans/${CRM_B}`, {
      token: signAccess(ORG_B),
    });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("Org-B can create a success plan for its own org", async () => {
    const res = await request(`/customer-success/plans/${CRM_B}`, {
      method: "POST",
      token: signAccess(ORG_B),
      body: { name: "Org B growth plan", milestones: [] },
    });
    expect(res.status).toBe(201);
    expect(res.body.crmOrganizationId).toBe(CRM_B);
  });

  it("Org-B can trigger an intervention for its own org", async () => {
    const res = await request(`/customer-success/interventions/${CRM_B}`, {
      method: "POST",
      token: signAccess(ORG_B),
      body: { action: "Executive review" },
    });
    expect(res.status).toBe(201);
    expect(res.body.missionId).toBeDefined();
  });

  it("Org-B can complete its own milestone by ID", async () => {
    const res = await request(`/customer-success/plans/milestones/ms-b-1/complete`, {
      method: "POST",
      token: signAccess(ORG_B),
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("completed");
  });
});