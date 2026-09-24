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
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";
import { EventBus } from "@oracle69/shared";
import { AgentRegistry } from "@oracle69/agent-engine";
import { ExecutionEngine } from "@oracle69/execution-engine";
import { MemoryManager, ConversationManager } from "@oracle69/memory";
import { TasksController } from "../tasks/tasks.controller.js";
import { TasksService } from "../tasks/tasks.service.js";
import { DocumentsController } from "../documents/documents.controller.js";
import { DocumentsService } from "../documents/documents.service.js";
import { ProjectsController } from "../projects/projects.controller.js";
import { ProjectsService } from "../projects/projects.service.js";
import { DepartmentsController } from "../departments/departments.controller.js";
import { DepartmentsService } from "../departments/departments.service.js";
import { CalendarController } from "../calendar/calendar.controller.js";
import { CalendarService } from "../calendar/calendar.service.js";
import { SettingsController } from "../settings/settings.controller.js";
import { SettingsService } from "../settings/settings.service.js";
import { ActivityController } from "../activity/activity.controller.js";
import { ActivityService } from "../activity/activity.service.js";
import { ReceptionistController } from "../receptionist/receptionist.controller.js";
import { ReceptionistService } from "../receptionist/receptionist.service.js";
import * as http from "http";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long-000";

const ORG_A = "org-a";
const ORG_B = "org-b";
const PROJ_A = "proj-a";
const PROJ_B = "proj-b";
const AGENT_A = "agent-a";
const AGENT_B = "agent-b";
const CLIENT_A = "client-a";
const CLIENT_B = "client-b";
const DOC_A = "doc-a";
const DOC_B = "doc-b";

class TestEventBus extends EventBus {}

function buildPrismaMock() {
  const projects: Record<string, any> = {
    [PROJ_A]: { id: PROJ_A, organizationId: ORG_A },
    [PROJ_B]: { id: PROJ_B, organizationId: ORG_B },
  };
  const agents: Record<string, any> = {
    [AGENT_A]: { id: AGENT_A, name: "Agent A", organizationId: ORG_A },
    [AGENT_B]: { id: AGENT_B, name: "Agent B", organizationId: ORG_B },
  };
  const clients: Record<string, any> = {
    [CLIENT_A]: { id: CLIENT_A, name: "Client A", organizationId: ORG_A },
    [CLIENT_B]: { id: CLIENT_B, name: "Client B", organizationId: ORG_B },
  };
  const documents: Record<string, any> = {
    [DOC_A]: {
      id: DOC_A,
      title: "Doc A",
      projectId: PROJ_A,
      project: projects[PROJ_A],
    },
    [DOC_B]: {
      id: DOC_B,
      title: "Doc B",
      projectId: PROJ_B,
      project: projects[PROJ_B],
    },
  };
  const auditLogs: any[] = [];
  return {
    project: {
      findUnique: jest.fn(async ({ where }: any) => projects[where.id] ?? null),
      create: jest.fn(async ({ data }: any) => ({ id: "project-new", ...data })),
    },
    agent: {
      findUnique: jest.fn(async ({ where }: any) => agents[where.id] ?? null),
    },
    client: {
      findUnique: jest.fn(async ({ where }: any) => clients[where.id] ?? null),
    },
    task: {
      findUnique: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      create: jest.fn(async ({ data }: any) => ({ id: "task-new", ...data })),
      update: jest.fn(async ({ data }: any) => ({ id: "task-1", ...data })),
    },
    document: {
      findUnique: jest.fn(async ({ where }: any) => {
        const doc = documents[where.id];
        return doc ? { ...doc } : null;
      }),
      findMany: jest.fn(async () => []),
      create: jest.fn(async ({ data }: any) => ({ id: "doc-new", ...data })),
    },
    department: {
      create: jest.fn(async ({ data }: any) => ({ id: "dept-new", ...data })),
    },
    calendarEvent: {
      create: jest.fn(async ({ data }: any) => ({ id: "event-new", ...data })),
    },
    setting: {
      findMany: jest.fn(async () => []),
      upsert: jest.fn(async ({ create, update, where }: any) => ({
        id: "setting-new",
        ...create,
        ...update,
        where,
      })),
    },
    auditLog: {
      create: jest.fn(async ({ data }: any) => ({ id: "log-new", ...data })),
      findMany: jest.fn(async () => auditLogs),
    },
  };
}

@Module({
  controllers: [
    TasksController,
    DocumentsController,
    ProjectsController,
    DepartmentsController,
    CalendarController,
    SettingsController,
    ActivityController,
    ReceptionistController,
  ],
  providers: [
    TasksService,
    DocumentsService,
    ProjectsService,
    DepartmentsService,
    CalendarService,
    SettingsService,
    ActivityService,
    ReceptionistService,
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
    {
      provide: ExecutionEngine,
      useValue: {},
    },
    {
      provide: MemoryManager,
      useValue: { saveSession: jest.fn(), saveMemory: jest.fn() },
    },
    {
      provide: ConversationManager,
      useValue: {
        buildContext: jest.fn(async () => "context"),
        saveMessage: jest.fn(),
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
class WorkstreamABatch1Module {}

describe("Workstream A Batch 1 — API security boundary regression", () => {
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
        WorkstreamABatch1Module,
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
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

  // ---- Settings (HIGH: IDOR + mass-assignment) ----

  it("PATCH /settings/me rejects an unknown (non-allowlisted) key with 400", async () => {
    const res = await request("/settings/me", {
      method: "PATCH",
      token: signAccess(ORG_A),
      body: { key: "adminOverride", value: true },
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /settings/me accepts an allowlisted key", async () => {
    const res = await request("/settings/me", {
      method: "PATCH",
      token: signAccess(ORG_A),
      body: { key: "theme", value: "dark" },
    });
    expect(res.status).toBe(200);
  });

  it("GET /settings/me reads settings associated with the authenticated user", async () => {
    const res = await request("/settings/me", { token: signAccess(ORG_A) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---- Documents (HIGH: projectless IDOR) ----

  it("POST /documents without projectId is rejected with 400", async () => {
    const res = await request("/documents", {
      method: "POST",
      token: signAccess(ORG_A),
      body: { title: "doc", category: "contract", storageUrl: "s3://x" },
    });
    expect(res.status).toBe(400);
  });

  it("POST /documents strips client-supplied tenant overrides (400 on organizationId)", async () => {
    const res = await request("/documents", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "doc",
        category: "contract",
        storageUrl: "s3://x",
        projectId: PROJ_A,
        organizationId: ORG_B,
      },
    });
    expect(res.status).toBe(400);
  });

  it("POST /documents rejects a project from another tenant with 404", async () => {
    const res = await request("/documents", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "doc",
        category: "contract",
        storageUrl: "s3://x",
        projectId: PROJ_B,
      },
    });
    expect(res.status).toBe(404);
  });

  it("POST /documents binds ownerId to the authenticated user (never the client)", async () => {
    const res = await request("/documents", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "doc",
        category: "contract",
        storageUrl: "s3://x",
        projectId: PROJ_A,
      },
    });
    expect(res.status).toBe(201);
    const prisma = app.get(PrismaService);
    const createCall = ((prisma.document.create as any).mock.calls[0][0] as any).data;
    expect(createCall.ownerId).toBe("user-a");
    expect(createCall.organizationId).toBeUndefined();
  });

  it("GET /documents/:id hides documents of another tenant (404)", async () => {
    const res = await request(`/documents/${DOC_B}`, { token: signAccess(ORG_A) });
    expect(res.status).toBe(404);
  });

  // ---- Tasks (fail-closed tenant + assigned-agent validation) ----

  it("POST /tasks rejects a foreign-tenant assignedAgentId with 400", async () => {
    const res = await request("/tasks", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "t",
        projectId: PROJ_A,
        assignedAgentId: AGENT_B,
      },
    });
    expect(res.status).toBe(400);
  });

  it("POST /tasks accepts an own-tenant assignedAgentId", async () => {
    const res = await request("/tasks", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "t",
        projectId: PROJ_A,
        assignedAgentId: AGENT_A,
        priority: "high",
      },
    });
    expect(res.status).toBe(201);
  });

  it("PATCH /tasks/:id/status rejects an unknown status with 400", async () => {
    const res = await request("/tasks/task-1/status", {
      method: "PATCH",
      token: signAccess(ORG_A),
      body: { status: "obliterated" },
    });
    expect(res.status).toBe(400);
  });

  // ---- Projects (client validation) ----

  it("POST /projects rejects a foreign-tenant clientId with 400", async () => {
    const res = await request("/projects", {
      method: "POST",
      token: signAccess(ORG_A),
      body: { title: "p", clientId: CLIENT_B },
    });
    expect(res.status).toBe(400);
  });

  it("POST /projects accepts an own-tenant clientId", async () => {
    const res = await request("/projects", {
      method: "POST",
      token: signAccess(ORG_A),
      body: { title: "p", clientId: CLIENT_A, status: "planning" },
    });
    expect(res.status).toBe(201);
  });

  // ---- Departments ----

  it("POST /departments strips client-supplied organizationId (400)", async () => {
    const res = await request("/departments", {
      method: "POST",
      token: signAccess(ORG_A),
      body: { name: "Eng", organizationId: ORG_B },
    });
    expect(res.status).toBe(400);
  });

  it("POST /departments accepts an own-tenant department", async () => {
    const res = await request("/departments", {
      method: "POST",
      token: signAccess(ORG_A),
      body: { name: "Eng" },
    });
    expect(res.status).toBe(201);
  });

  // ---- Calendar (ownerId server-bound) ----

  it("POST /calendar strips client-supplied ownerId/organizationId (400)", async () => {
    const res = await request("/calendar", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "meeting",
        start: "2026-10-01T10:00:00Z",
        end: "2026-10-01T11:00:00Z",
        ownerId: "someone-else",
        organizationId: ORG_B,
      },
    });
    expect(res.status).toBe(400);
  });

  it("POST /calendar binds ownerId to the authenticated user", async () => {
    const res = await request("/calendar", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "meeting",
        start: "2026-10-01T10:00:00Z",
        end: "2026-10-01T11:00:00Z",
      },
    });
    expect(res.status).toBe(201);
    const prisma = app.get(PrismaService);
    const createCall = ((prisma.calendarEvent.create as any).mock.calls.at(-1)[0] as any).data;
    expect(createCall.ownerId).toBe("user-a");
    expect(createCall.organizationId).toBe(ORG_A);
  });

  it("POST /calendar rejects an event whose end precedes its start (400)", async () => {
    const res = await request("/calendar", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {
        title: "backwards",
        start: "2026-10-01T11:00:00Z",
        end: "2026-10-01T10:00:00Z",
      },
    });
    expect(res.status).toBe(400);
  });

  // ---- Receptionist (DTO boundary) ----

  it("POST /receptionist/chat rejects non-whitelisted body fields (400)", async () => {
    const res = await request("/receptionist/chat", {
      method: "POST",
      token: signAccess(ORG_A),
      body: { message: "hi", organizationId: ORG_B },
    });
    expect(res.status).toBe(400);
  });

  it("POST /receptionist/chat rejects a missing message (400)", async () => {
    const res = await request("/receptionist/chat", {
      method: "POST",
      token: signAccess(ORG_A),
      body: {},
    });
    expect(res.status).toBe(400);
  });

  // ---- Activity (pagination bounds) ----

  it("GET /activity/feed enforces an upper bound on limit (400)", async () => {
    const res = await request("/activity/feed?limit=100000", {
      token: signAccess(ORG_A),
    });
    expect(res.status).toBe(400);
  });

  it("GET /activity/feed accepts a bounded limit", async () => {
    const res = await request("/activity/feed?limit=10", {
      token: signAccess(ORG_A),
    });
    expect(res.status).toBe(200);
  });
});
