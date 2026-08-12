import "reflect-metadata";
import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Global, Module } from "@nestjs/common";
import {
  HrIntelligenceModule,
  HrController,
  HrEventType,
  EmployeeStatus,
  PositionStatus,
} from "@oracle69/hr-intelligence";
import { EventBus, EventCatalogService, TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: {
        hrEmployee: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
        },
        hrPosition: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
        },
        hrCandidate: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
        },
        runtimeEventLog: {
          // @ts-ignore
          upsert: jest.fn().mockResolvedValue({}),
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

describe("HR Intelligence backend integration (Sprint 8.9)", () => {
  let moduleRef: TestingModule;
  let controller: HrController;
  let eventBus: EventBus;
  let catalog: EventCatalogService;
  let tenantContext: TenantContextService;
  let prisma: any;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MockPrismaModule, HrIntelligenceModule],
    }).compile();

    await moduleRef.init();

    controller = moduleRef.get(HrController);
    eventBus = moduleRef.get(EventBus);
    catalog = moduleRef.get(EventCatalogService);
    tenantContext = moduleRef.get(TenantContextService);
    prisma = moduleRef.get(PrismaClient);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.hrEmployee.create.mockResolvedValue({
      id: "emp-1",
      hireDate: new Date("2026-08-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.hrEmployee.findMany.mockResolvedValue([]);
    prisma.hrPosition.findMany.mockResolvedValue([]);
    prisma.hrCandidate.findMany.mockResolvedValue([]);
  });

  it("should wire the HrController REST surface through the backend module", () => {
    expect(controller).toBeDefined();
    expect(eventBus).toBeDefined();
    expect(tenantContext).toBeDefined();
  });

  it("should register HR domain events in the canonical Event Catalog", () => {
    expect(catalog.isCanonical(HrEventType.EMPLOYEE_HIRED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.EMPLOYEE_UPDATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.EMPLOYEE_OFFBOARDED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.POSITION_CREATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.POSITION_CLOSED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.CANDIDATE_CREATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.CANDIDATE_STAGE_UPDATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.CANDIDATE_HIRED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.INSIGHT_GENERATED)).toBe(true);
  });

  it("should hire and offboard employees through the controller", async () => {
    prisma.hrEmployee.create.mockResolvedValue({
      id: "emp-1",
      fullName: "Jane Doe",
      email: "jane@example.com",
      department: "Engineering",
      title: "Software Engineer",
      status: EmployeeStatus.ONBOARDING,
      hireDate: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.hrEmployee.findUnique.mockResolvedValue({
      id: "emp-1",
      fullName: "Jane Doe",
      email: "jane@example.com",
      department: "Engineering",
      title: "Software Engineer",
      status: EmployeeStatus.ONBOARDING,
      hireDate: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const employee = await controller.hireEmployee("org-1", {
      fullName: "Jane Doe",
      email: "jane@example.com",
      department: "Engineering",
      title: "Software Engineer",
      hireDate: "2026-08-01T00:00:00.000Z",
    });

    expect(employee.fullName).toBe("Jane Doe");
    expect(prisma.hrEmployee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", status: "onboarding" }),
      }),
    );

    prisma.hrEmployee.update.mockResolvedValue({
      id: "emp-1",
      fullName: "Jane Doe",
      email: "jane@example.com",
      department: "Engineering",
      title: "Software Engineer",
      status: EmployeeStatus.INACTIVE,
      terminationDate: new Date(),
      hireDate: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const offboarded = await controller.offboardEmployee("org-1", employee.id);
    expect(offboarded.status).toBe(EmployeeStatus.INACTIVE);
    expect(prisma.hrEmployee.update).toHaveBeenCalledTimes(1);
  });

  it("should manage positions and the candidate pipeline through the controller", async () => {
    prisma.hrPosition.create.mockResolvedValue({
      id: "pos-1",
      title: "Engineer",
      department: "Engineering",
      employmentType: "full_time",
      status: PositionStatus.OPEN,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.hrPosition.findUnique.mockResolvedValue({
      id: "pos-1",
      title: "Engineer",
      department: "Engineering",
      employmentType: "full_time",
      status: PositionStatus.OPEN,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.hrCandidate.create.mockResolvedValue({
      id: "cand-1",
      positionId: "pos-1",
      name: "Sam Green",
      email: "sam@example.com",
      stage: "applied",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const position = await controller.createPosition("org-1", {
      title: "Engineer",
      department: "Engineering",
      employmentType: "full_time",
    });
    expect(position.organizationId).toBe("org-1");

    const candidate = await controller.createCandidate("org-1", {
      positionId: "pos-1",
      name: "Sam Green",
      email: "sam@example.com",
    });
    expect(candidate.stage).toBe("applied");

    prisma.hrCandidate.update.mockResolvedValue({
      id: "cand-1",
      positionId: "pos-1",
      name: "Sam Green",
      email: "sam@example.com",
      stage: "interviewing",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    prisma.hrCandidate.findUnique.mockResolvedValue({
      id: "cand-1",
      positionId: "pos-1",
      name: "Sam Green",
      email: "sam@example.com",
      stage: "applied",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const staged = await controller.updateCandidateStage("org-1", "cand-1", { stage: "interviewing" });
    expect(staged.stage).toBe("interviewing");
    expect(prisma.hrCandidate.update).toHaveBeenCalledTimes(1);
  });

  it("should compute workforce KPIs and health through the controller", async () => {
    prisma.hrEmployee.findMany.mockResolvedValue([
      {
        id: "emp-a",
        fullName: "A",
        email: "a@example.com",
        department: "Eng",
        title: "E",
        status: EmployeeStatus.ACTIVE,
        hireDate: new Date("2026-08-01T00:00:00.000Z"),
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "emp-b",
        fullName: "B",
        email: "b@example.com",
        department: "Eng",
        title: "E",
        status: EmployeeStatus.ACTIVE,
        hireDate: new Date("2026-08-02T00:00:00.000Z"),
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const kpis = await controller.getKpis("org-1");
    expect(kpis.headcount).toBe(2);
    expect(kpis.activeHeadcount).toBe(2);
    expect(kpis.turnoverRate).toBe(0);

    const health = await controller.getHealth("org-1");
    expect(health.status).toBe("healthy");
    expect(health.kpis.headcount).toBe(2);
    expect(health.reasoning.length).toBeGreaterThan(0);
  });

  it("should enforce strict tenant isolation for HR resources", async () => {
    prisma.hrEmployee.findUnique.mockResolvedValue({
      id: "emp-owner",
      fullName: "Owner",
      email: "owner@example.com",
      department: "Eng",
      title: "E",
      status: EmployeeStatus.ACTIVE,
      hireDate: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.hrPosition.findUnique.mockResolvedValue({
      id: "pos-owner",
      title: "Engineer",
      department: "Eng",
      employmentType: "full_time",
      status: PositionStatus.OPEN,
      organizationId: "org-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.hrCandidate.findUnique.mockResolvedValue({
      id: "cand-owner",
      positionId: "pos-owner",
      name: "Owner Candidate",
      email: "cand@example.com",
      stage: "applied",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
      organizationId: "org-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(await controller.listEmployees("org-attacker")).toEqual([]);
    await expect(controller.updateEmployee("org-attacker", "emp-owner", { title: "Hacked" })).rejects.toThrow(
      "Employee not found",
    );
    await expect(controller.offboardEmployee("org-attacker", "emp-owner")).rejects.toThrow("Employee not found");
    await expect(controller.closePosition("org-attacker", "pos-owner")).rejects.toThrow("Position not found");
    await expect(controller.hireCandidate("org-attacker", "cand-owner")).rejects.toThrow("Candidate not found");
  });

  it("should assess workforce health and generate deterministic insights without an AI provider", async () => {
    delete process.env.GOOGLE_AI_API_KEY;

    prisma.hrEmployee.findMany.mockResolvedValue([
      {
        id: "emp-c",
        fullName: "C",
        email: "c@example.com",
        department: "Eng",
        title: "E",
        status: EmployeeStatus.ACTIVE,
        hireDate: new Date("2026-08-01T00:00:00.000Z"),
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const health = await controller.getHealth("org-1");
    expect(health.status).toBe("healthy");
    expect(health.kpis.headcount).toBe(1);

    const insights = await controller.getInsights("org-1");
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.every((i: any) => typeof i.content === "string" && i.content.length > 0)).toBe(true);
  });
});
