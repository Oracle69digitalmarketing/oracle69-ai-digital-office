import "reflect-metadata";
import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Global, Module } from "@nestjs/common";
import {
  RuntimeModule,
  EventBus,
  EventCatalogService,
  MissionManager,
  DeploymentService,
  TenantContextService,
  RuntimeEventType,
} from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: {
        runtimeEventLog: {
          // @ts-ignore
          upsert: jest.fn().mockResolvedValue({}),
        },
        mission: {
          // @ts-ignore
          findMany: jest.fn().mockResolvedValue([]),
        },
        deployment: {
          // @ts-ignore
          findMany: jest.fn().mockResolvedValue([]),
          // @ts-ignore
          findFirst: jest.fn().mockResolvedValue(null),
        },
        // @ts-ignore
        $connect: jest.fn().mockResolvedValue(undefined),
      } as any,
    },
    {
      provide: "PrismaService",
      useExisting: PrismaClient,
    },
  ],
  exports: [PrismaClient, "PrismaService"],
})
class MockPrismaModule {}

describe("Runtime-to-Backend integration (Sprint 8.7)", () => {
  let moduleRef: TestingModule;
  let eventBus: EventBus;
  let catalog: EventCatalogService;
  let missionManager: MissionManager;
  let deploymentService: DeploymentService;
  let tenantContext: TenantContextService;
  let prisma: any;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MockPrismaModule, RuntimeModule],
    }).compile();

    await moduleRef.init();

    eventBus = moduleRef.get(EventBus);
    catalog = moduleRef.get(EventCatalogService);
    missionManager = moduleRef.get(MissionManager);
    deploymentService = moduleRef.get(DeploymentService);
    tenantContext = moduleRef.get(TenantContextService);
    prisma = moduleRef.get(PrismaClient);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("should wire the canonical EventBus and EventCatalogService through the backend", () => {
    expect(eventBus).toBeDefined();
    expect(catalog.isCanonical(RuntimeEventType.RUNTIME_READY)).toBe(true);
    expect(catalog.isCanonical("crm.organization.created")).toBe(false);
  });

  it("should register the persistent EventLog as a sink on module init", async () => {
    prisma.runtimeEventLog.upsert.mockClear();

    eventBus.publish(
      RuntimeEventType.MISSION_CREATED,
      { missionId: "m1" },
      {
        tenantId: "org-1",
        idempotencyKey: "mission.created:m1:org-1",
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(prisma.runtimeEventLog.upsert).toHaveBeenCalledTimes(1);
    const call = prisma.runtimeEventLog.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ eventId: expect.any(String) });
    expect(call.create).toMatchObject({ type: "mission.created", tenantId: "org-1" });
  });

  it("should expose tenant-aware services through the runtime module", () => {
    expect(missionManager).toBeDefined();
    expect(deploymentService).toBeDefined();
    expect(tenantContext).toBeDefined();
  });

  it("should enforce tenant scope for deployment retrieval", async () => {
    await expect(deploymentService.listDeployments()).rejects.toThrow(/Tenant Context Failure/);

    await tenantContext.run({ tenantId: "org-1" }, async () => {
      const deployments = await deploymentService.listDeployments();
      expect(deployments).toEqual([]);
    });
  });

  it("should propagate the tenant scope to events published during execution", async () => {
    const received: any[] = [];
    eventBus.allEvents().subscribe((event) => received.push(event));

    await tenantContext.run({ tenantId: "org-exec", correlationId: "corr-exec" }, async () => {
      eventBus.publish(RuntimeEventType.WORKFLOW_STARTED, { workflowId: "wf-1" });
    });

    expect(received[received.length - 1].tenantId).toBe("org-exec");
    expect(received[received.length - 1].correlationId).toBe("corr-exec");
  });

  it("should survive a mission recovery bootstrap without an active tenant context", async () => {
    prisma.mission.findMany.mockClear();
    await expect(missionManager.recoverInterrupted()).rejects.toThrow(/Tenant Context Failure/);
  });
});
