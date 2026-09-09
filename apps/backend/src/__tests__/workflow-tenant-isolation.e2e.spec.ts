import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import {
  Module,
  INestApplication,
  ValidationPipe,
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
import { TenantContextService } from "@oracle69/runtime";
import { EventBus } from "@oracle69/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { ExecutionEngine } from "@oracle69/execution-engine";
import { AgentRegistry } from "@oracle69/agent-engine";
import { WorkflowsService } from "../workflows/workflows.service.js";
import { WorkflowsController } from "../workflows/workflows.controller.js";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";

const ORG_A = { projectId: "proj-a", workflowId: "wf-a", taskId: "task-a" };
const ORG_B = { projectId: "proj-b", workflowId: "wf-b", taskId: "task-b" };

function buildPrismaMock() {
  const projects: Record<string, any> = {
    [ORG_A.projectId]: { id: ORG_A.projectId, organizationId: "org-a" },
    [ORG_B.projectId]: { id: ORG_B.projectId, organizationId: "org-b" },
  };

  const workflows: Record<string, any> = {
    [ORG_A.workflowId]: {
      id: ORG_A.workflowId,
      name: "Org A Workflow",
      status: "not_started",
      projectId: ORG_A.projectId,
      project: { ...projects[ORG_A.projectId] },
      createdAt: new Date(),
      completedAt: null,
    },
    [ORG_B.workflowId]: {
      id: ORG_B.workflowId,
      name: "Org B Workflow",
      status: "not_started",
      projectId: ORG_B.projectId,
      project: { ...projects[ORG_B.projectId] },
      createdAt: new Date(),
      completedAt: null,
    },
  };

  let nextWfId = 100;
  const memories: any[] = [];

  const tasks: Record<string, any> = {
    [ORG_A.taskId]: {
      id: ORG_A.taskId,
      title: "Org A Task",
      status: "pending",
      projectId: ORG_A.projectId,
      project: projects[ORG_A.projectId],
    },
    [ORG_B.taskId]: {
      id: ORG_B.taskId,
      title: "Org B Task",
      status: "pending",
      projectId: ORG_B.projectId,
      project: projects[ORG_B.projectId],
    },
  };

  return {
    project: {
      findUnique: jest.fn(async ({ where }: any) => {
        return projects[where.id] ?? null;
      }),
    },
    workflow: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const wf = workflows[where.id];
        if (!wf) return null;
        if (include?.project) return { ...wf, project: { ...wf.project } };
        return { ...wf };
      }),
      findMany: jest.fn(async ({ where, include }: any) => {
        const orgId = where?.project?.organizationId;
        let results = Object.values(workflows);
        if (orgId) {
          results = results.filter((w) => w.project.organizationId === orgId);
        }
        return results.map((w) =>
          include?.project ? { ...w, project: { ...w.project } } : { ...w },
        );
      }),
      create: jest.fn(async ({ data }: any) => {
        const id = `wf-new-${nextWfId++}`;
        const project = projects[data.projectId];
        const wf = {
          id,
          name: data.name,
          status: data.status ?? "not_started",
          projectId: data.projectId,
          project,
          createdAt: new Date(),
          completedAt: null,
        };
        workflows[id] = wf;
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
      findUnique: jest.fn(async ({ where, include }: any) => {
        const task = tasks[where.id];
        if (!task) return null;
        if (include?.project) return { ...task, project: { ...task.project } };
        return { ...task };
      }),
    },
    memory: {
      create: jest.fn(async ({ data }: any) => {
        const record = { id: `mem-${memories.length + 1}`, ...data };
        memories.push(record);
        return record;
      }),
      findMany: jest.fn(async () => [...memories]),
    },
    memories,
  };
}

class TestEventBus extends EventBus {}

const prismaMock = buildPrismaMock();

@Module({
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    { provide: PrismaService, useValue: prismaMock },
    { provide: EventBus, useClass: TestEventBus },
    {
      provide: ExecutionEngine,
      useValue: { executeTask: jest.fn() },
    },
    {
      provide: AgentRegistry,
      useValue: {
        getAllAgents: jest.fn(() => []),
        getAgent: jest.fn(() => undefined),
      },
    },
    TenantContextService,
    JwtStrategy,
    JwtAuthGuard,
    Reflector,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
class WorkflowTestAppModule {}

describe("Phase 2 Step 5 — Workflow tenant isolation", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let eventBus: EventBus;
  let workflowsService: WorkflowsService;

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
        WorkflowTestAppModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    jwtService = moduleRef.get(JwtService);
    eventBus = moduleRef.get(EventBus);
    workflowsService = moduleRef.get(WorkflowsService);
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

  it("A. Org-A can create a workflow under its own project", async () => {
    const res = await request("/workflows", {
      method: "POST",
      token: signAccess("org-a"),
      body: { name: "Org A New Workflow", projectId: ORG_A.projectId },
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Org A New Workflow");
    expect(res.body.projectId).toBe(ORG_A.projectId);
  });

  it("A. Org-A can read its own workflow by ID", async () => {
    const res = await request(`/workflows/${ORG_A.workflowId}`, {
      token: signAccess("org-a"),
    });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ORG_A.workflowId);
  });

  it("A. Org-A can list its own workflows", async () => {
    const res = await request("/workflows", { token: signAccess("org-a") });
    expect(res.status).toBe(200);
    const ids = res.body.map((w: any) => w.id);
    expect(ids).toContain(ORG_A.workflowId);
  });

  it("A. Org-A can update status of its own workflow", async () => {
    const res = await request(`/workflows/${ORG_A.workflowId}/status`, {
      method: "PATCH",
      token: signAccess("org-a"),
      body: { status: "in_progress" },
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
  });

  it("B. Org-B can create a workflow under its own project", async () => {
    const res = await request("/workflows", {
      method: "POST",
      token: signAccess("org-b"),
      body: { name: "Org B New Workflow", projectId: ORG_B.projectId },
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Org B New Workflow");
    expect(res.body.projectId).toBe(ORG_B.projectId);
  });

  it("B. Org-B can read its own workflow by ID", async () => {
    const res = await request(`/workflows/${ORG_B.workflowId}`, {
      token: signAccess("org-b"),
    });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ORG_B.workflowId);
  });

  it("B. Org-B can list its own workflows", async () => {
    const res = await request("/workflows", { token: signAccess("org-b") });
    expect(res.status).toBe(200);
    const ids = res.body.map((w: any) => w.id);
    expect(ids).toContain(ORG_B.workflowId);
  });

  it("B. Org-B can update status of its own workflow", async () => {
    const res = await request(`/workflows/${ORG_B.workflowId}/status`, {
      method: "PATCH",
      token: signAccess("org-b"),
      body: { status: "in_progress" },
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
  });

  it("C. Org-A cannot read Org-B workflow (404)", async () => {
    const res = await request(`/workflows/${ORG_B.workflowId}`, {
      token: signAccess("org-a"),
    });
    expect(res.status).toBe(404);
  });

  it("D. Org-A cannot update Org-B workflow (404)", async () => {
    const res = await request(`/workflows/${ORG_B.workflowId}/status`, {
      method: "PATCH",
      token: signAccess("org-a"),
      body: { status: "completed" },
    });
    expect(res.status).toBe(404);
  });

  it("C. Org-A GET /workflows does not include Org-B workflows", async () => {
    const res = await request("/workflows", { token: signAccess("org-a") });
    expect(res.status).toBe(200);
    const ids = res.body.map((w: any) => w.id);
    expect(ids).not.toContain(ORG_B.workflowId);
  });

  it("C. Org-B GET /workflows does not include Org-A workflows", async () => {
    const res = await request("/workflows", { token: signAccess("org-b") });
    expect(res.status).toBe(200);
    const ids = res.body.map((w: any) => w.id);
    expect(ids).not.toContain(ORG_A.workflowId);
  });

  it("E. TaskCompleted event for Org-B task does not cause Org-A archive", async () => {
    const archiveSpy = jest.spyOn(prismaMock.memory, "create");
    const beforeCount = archiveSpy.mock.calls.length;

    workflowsService.onModuleInit();

    await new Promise<void>((resolve) => {
      const tenantContext = app.get(TenantContextService);
      tenantContext.run({ tenantId: "org-b" }, () => {
        eventBus.publish({
          type: "TaskCompleted" as any,
          payload: { taskId: ORG_B.taskId, result: { output: "done" } },
          source: "test-agent",
        });
        setTimeout(resolve, 100);
      });
    });

    const afterCalls = archiveSpy.mock.calls.slice(beforeCount);
    for (const call of afterCalls) {
      expect(call[0].data.projectId).not.toBe(ORG_A.projectId);
    }
  });

  it("F. TaskCompleted event for Org-A task archives to memory with correct project", async () => {
    const archiveSpy = jest.spyOn(prismaMock.memory, "create");
    const beforeCount = archiveSpy.mock.calls.length;

    await new Promise<void>((resolve) => {
      const tenantContext = app.get(TenantContextService);
      tenantContext.run({ tenantId: "org-a" }, () => {
        eventBus.publish({
          type: "TaskCompleted" as any,
          payload: { taskId: ORG_A.taskId, result: { output: "org-a-result" } },
          source: "test-agent",
        });
        setTimeout(resolve, 100);
      });
    });

    const afterCalls = archiveSpy.mock.calls.slice(beforeCount);
    expect(afterCalls.length).toBeGreaterThanOrEqual(1);
    expect(afterCalls[0][0].data.category).toBe("TASK_RESULT");
    expect(afterCalls[0][0].data.projectId).toBe(ORG_A.projectId);
  });

  it("F. TaskCompleted event for Org-B task does NOT write memory with Org-A project", async () => {
    const archiveSpy = jest.spyOn(prismaMock.memory, "create");
    const beforeCount = archiveSpy.mock.calls.length;

    await new Promise<void>((resolve) => {
      const tenantContext = app.get(TenantContextService);
      tenantContext.run({ tenantId: "org-b" }, () => {
        eventBus.publish({
          type: "TaskCompleted" as any,
          payload: { taskId: ORG_B.taskId, result: { output: "org-b-result" } },
          source: "test-agent",
        });
        setTimeout(resolve, 100);
      });
    });

    const afterCalls = archiveSpy.mock.calls.slice(beforeCount);
    for (const call of afterCalls) {
      expect(call[0].data.projectId).not.toBe(ORG_A.projectId);
    }
  });

  it("A. Org-A cannot create workflow referencing Org-B project (404)", async () => {
    const res = await request("/workflows", {
      method: "POST",
      token: signAccess("org-a"),
      body: { name: "Sneaky Workflow", projectId: ORG_B.projectId },
    });
    expect(res.status).toBe(404);
  });
});
