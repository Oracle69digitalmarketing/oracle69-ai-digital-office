import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Module,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
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
import { TasksService } from "../tasks/tasks.service.js";
import { ActivityService } from "../activity/activity.service.js";
import { AgentsService } from "../agents/agents.service.js";
import { DocumentsService } from "../documents/documents.service.js";
import { EventBus } from "@oracle69/shared";
import { AgentRegistry } from "@oracle69/agent-engine";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";

const ORG_A = {
  orgAProjectId: "proj-a",
  orgATaskId: "task-a",
  orgAAgentId: "agent-a",
  orgADocId: "doc-a",
};

const ORG_B = {
  orgBProjectId: "proj-b",
  orgBTaskId: "task-b",
  orgBAgentId: "agent-b",
  orgBDocId: "doc-b",
};

function buildPrismaMock() {
  const tasks = [
    {
      id: ORG_A.orgATaskId,
      title: "Org A task",
      status: "pending",
      projectId: ORG_A.orgAProjectId,
      project: { organizationId: "org-a" },
      assignedAgent: null,
    },
    {
      id: ORG_B.orgBTaskId,
      title: "Org B task",
      status: "pending",
      projectId: ORG_B.orgBProjectId,
      project: { organizationId: "org-b" },
      assignedAgent: null,
    },
  ];

  const projects = [
    { id: ORG_A.orgAProjectId, organizationId: "org-a" },
    { id: ORG_B.orgBProjectId, organizationId: "org-b" },
  ];

  const agents = [
    { id: ORG_A.orgAAgentId, name: "Agent A", organizationId: "org-a" },
    { id: ORG_B.orgBAgentId, name: "Agent B", organizationId: "org-b" },
  ];

  const documents = [
    {
      id: ORG_A.orgADocId,
      title: "Doc A",
      projectId: ORG_A.orgAProjectId,
      project: { organizationId: "org-a" },
    },
    {
      id: ORG_B.orgBDocId,
      title: "Doc B",
      projectId: ORG_B.orgBProjectId,
      project: { organizationId: "org-b" },
    },
  ];

  const auditLogs = [
    { id: "log-a", organizationId: "org-a", user: { name: "A", email: "a@b.com" } },
    { id: "log-b", organizationId: "org-b", user: { name: "B", email: "b@b.com" } },
  ];

  return {
    task: {
      findMany: jest.fn(async (args: any) => {
        const orgId = args?.where?.project?.organizationId;
        if (orgId != null) {
          return tasks.filter((t) => t.project.organizationId === orgId);
        }
        return tasks;
      }),
      findUnique: jest.fn(async (args: any) => {
        const found = tasks.find((t) => t.id === args.where.id);
        return found || null;
      }),
      create: jest.fn(async (args: any) => {
        const created = { id: `new-${args.data.title}`, ...args.data };
        tasks.push({
          id: created.id,
          title: created.title,
          status: created.status || "pending",
          projectId: created.projectId,
          project: projects.find((p) => p.id === created.projectId) as {
            organizationId: string;
          },
          assignedAgent: null,
        });
        return { ...created, project: undefined, assignedAgent: null };
      }),
      update: jest.fn(async (args: any) => {
        const existing = tasks.find((t) => t.id === args.where.id);
        if (!existing) {
          throw new Error("Record to update not found.");
        }
        Object.assign(existing, args.data);
        return existing;
      }),
    },
    project: {
      findUnique: jest.fn(async (args: any) => {
        return projects.find((p) => p.id === args.where.id) || null;
      }),
    },
    agent: {
      findMany: jest.fn(async (args: any) => {
        const orgId = args?.where?.organizationId;
        if (orgId != null) {
          return agents.filter((a) => a.organizationId === orgId);
        }
        return agents;
      }),
      findUnique: jest.fn(async (args: any) => {
        return agents.find((a) => a.id === args.where.id) || null;
      }),
    },
    document: {
      findMany: jest.fn(async (args: any) => {
        const orgId = args?.where?.project?.organizationId;
        if (orgId != null) {
          return documents.filter(
            (d) =>
              d.project &&
              d.project.organizationId === orgId,
          );
        }
        return documents;
      }),
      findUnique: jest.fn(async (args: any) => {
        return documents.find((d) => d.id === args.where.id) || null;
      }),
      create: jest.fn(async (args: any) => {
        const created = { id: `new-doc-${args.data.title}`, ...args.data };
        documents.push(created);
        return created;
      }),
    },
    auditLog: {
      create: jest.fn(async (args: any) => {
        const created = { id: `new-log-${Date.now()}`, ...args.data };
        auditLogs.push(created);
        return created;
      }),
      findMany: jest.fn(async (args: any) => {
        const orgId = args?.where?.organizationId;
        if (orgId != null) {
          return auditLogs.filter((l) => l.organizationId === orgId);
        }
        return auditLogs;
      }),
    },
  };
}

class TestEventBus extends EventBus {}

@Controller("tasks")
class TasksTestController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Req() req: any,
  ) {
    return this.tasksService.updateStatus(id, status, req.user?.userId);
  }

  @Post()
  create(@Body() data: any) {
    return this.tasksService.create(data);
  }
}

@Controller("activity")
class ActivityTestController {
  constructor(private readonly activityService: ActivityService) {}

  @Get("feed")
  getFeed(@Query("limit") limit?: number) {
    return this.activityService.getFeed(limit ? Number(limit) : 50);
  }
}

@Controller("agents")
class AgentsTestController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.agentsService.findOne(id);
  }
}

@Controller("documents")
class DocumentsTestController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() data: any) {
    return this.documentsService.create(data, req.user.userId);
  }
}

@Module({
  controllers: [
    TasksTestController,
    ActivityTestController,
    AgentsTestController,
    DocumentsTestController,
  ],
  providers: [
    TasksService,
    ActivityService,
    AgentsService,
    DocumentsService,
    { provide: EventBus, useClass: TestEventBus },
    { provide: PrismaService, useValue: buildPrismaMock() },
    {
      provide: AgentRegistry,
      useValue: {
        getAllAgents: jest.fn(() => []),
        getAgent: jest.fn(() => undefined),
        register: jest.fn(),
        deregister: jest.fn(),
      },
    },
    JwtStrategy,
    JwtAuthGuard,
    Reflector,
    TenantContextService,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
class TenantScopedAppModule {}

describe("Phase 2 Step 3 — service-level tenant data scoping", () => {
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
        { module: TenantScopedAppModule, global: true },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
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
          headers: opts.body
            ? { "Content-Type": "application/json" }
            : undefined,
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

  it("Org-A GET /tasks returns only Org-A tasks", async () => {
    const res = await request("/tasks", { token: signAccess("org-a") });
    expect(res.status).toBe(200);
    const titles = res.body.map((t: any) => t.title);
    expect(titles).toContain("Org A task");
    expect(titles).not.toContain("Org B task");
  });

  it("Org-A GET /tasks/:foreignTaskId cannot retrieve Org-B task (404)", async () => {
    const res = await request(`/tasks/${ORG_B.orgBTaskId}`, {
      token: signAccess("org-a"),
    });
    expect(res.status).toBe(404);
  });

  it("Org-A POST /tasks with organizationId=Org-B cannot create a task under Org-B", async () => {
    const res = await request("/tasks", {
      method: "POST",
      token: signAccess("org-a"),
      body: {
        title: "sneaky task",
        projectId: ORG_A.orgAProjectId,
        organizationId: "org-b",
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.organizationId).toBeUndefined();
  });

  it("Org-A POST /tasks referencing Org-B project must be rejected", async () => {
    const res = await request("/tasks", {
      method: "POST",
      token: signAccess("org-a"),
      body: {
        title: "foreign project task",
        projectId: ORG_B.orgBProjectId,
      },
    });
    expect(res.status).toBe(404);
  });

  it("Org-A PATCH /tasks/:foreignTaskId/status cannot modify Org-B task", async () => {
    const res = await request(`/tasks/${ORG_B.orgBTaskId}/status`, {
      method: "PATCH",
      token: signAccess("org-a"),
      body: { status: "completed" },
    });
    expect(res.status).toBe(404);
  });

  it("Org-A GET /activity/feed returns only Org-A activity", async () => {
    const res = await request("/activity/feed", { token: signAccess("org-a") });
    expect(res.status).toBe(200);
    const ids = res.body.map((l: any) => l.id);
    expect(ids).toContain("log-a");
    expect(ids).not.toContain("log-b");
  });

  it("Org-A GET /agents returns only Org-A agents", async () => {
    const res = await request("/agents", { token: signAccess("org-a") });
    expect(res.status).toBe(200);
    const names = res.body.map((a: any) => a.name);
    expect(names).toContain("Agent A");
    expect(names).not.toContain("Agent B");
  });

  it("Org-A GET /agents/:foreignAgentId cannot retrieve Org-B agent", async () => {
    const res = await request(`/agents/${ORG_B.orgBAgentId}`, {
      token: signAccess("org-a"),
    });
    expect(res.status).toBe(404);
  });

  it("Org-A POST /documents creates the document with Org-A organizationId regardless of any client organizationId field", async () => {
    const res = await request("/documents", {
      method: "POST",
      token: signAccess("org-a"),
      body: {
        title: "new doc",
        projectId: ORG_A.orgAProjectId,
        organizationId: "org-b",
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.organizationId).toBeUndefined();
  });

  it("Org-A GET /documents/:foreignDocumentId cannot retrieve Org-B document", async () => {
    const res = await request(`/documents/${ORG_B.orgBDocId}`, {
      token: signAccess("org-a"),
    });
    expect(res.status).toBe(404);
  });
});
