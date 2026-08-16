import "reflect-metadata";
import { describe, it, expect, beforeAll, beforeEach, afterAll, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Global, Module } from "@nestjs/common";
import {
  EnterpriseIntelligenceModule,
  EiKpiEngine,
  EiBusinessHealthEngine,
  EiForecastEngine,
  EiReportService,
} from "@oracle69/enterprise-intelligence";
import { EiController } from "../ei/ei.controller.js";
import { TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";

/**
 * Mock Prisma Module to isolate database calls during integration tests.
 */
@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: {
        organization: {
          findUnique: jest.fn(),
        },
        eiKpiSnapshot: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
        eiBusinessHealthSnapshot: {
          create: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        eiForecast: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
        eiEnterpriseReport: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
        csSuccessPlan: {
          count: jest.fn(),
        },
        csChurnRisk: {
          count: jest.fn(),
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
    {
      provide: "AiModelProvider",
      useValue: {
        generate: jest.fn(),
        analyze: jest.fn(),
      },
    },
  ],
  exports: [PrismaClient, "PrismaService", "AiModelProvider"],
})
class MockPrismaModule {}

describe("Executive Intelligence backend integration (Sprint 10)", () => {
  let moduleRef: TestingModule;
  let controller: EiController;
  let tenantContext: TenantContextService;
  let prisma: any;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MockPrismaModule, EnterpriseIntelligenceModule],
      controllers: [EiController],
    }).compile();

    await moduleRef.init();

    controller = moduleRef.get(EiController);
    tenantContext = moduleRef.get(TenantContextService);
    prisma = moduleRef.get(PrismaClient);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrg = {
    id: "org-1",
    name: "Test Org",
    crmOpportunities: [],
    crmLeads: [],
    crmContacts: [],
    crmOrganizations: [],
  };

  it("should wire the EiController REST surface through the backend module", () => {
    expect(controller).toBeDefined();
    expect(tenantContext).toBeDefined();
  });

  it("should enforce tenant isolation by resolving organizationId from context", async () => {
    prisma.organization.findUnique.mockResolvedValue(mockOrg);

    // Simulate req.user from JwtStrategy
    const req = { user: { organizationId: "org-1" } };

    const kpis = await controller.getKpi(req);
    expect(kpis).toBeDefined();
    expect(prisma.organization.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "org-1" } }),
    );
  });

  it("should return health status through the controller", async () => {
    prisma.organization.findUnique.mockResolvedValue(mockOrg);
    prisma.eiBusinessHealthSnapshot.findFirst.mockResolvedValue(null);

    const req = { user: { organizationId: "org-1" } };
    const health = await controller.getHealth(req);

    expect(health.status).toBeDefined();
    expect(prisma.eiBusinessHealthSnapshot.create).toHaveBeenCalled();
  });

  it("should return forecasts through the controller", async () => {
    prisma.organization.findUnique.mockResolvedValue(mockOrg);

    const req = { user: { organizationId: "org-1" } };
    const forecast = await controller.getForecast(req);

    expect(forecast.expectedRevenue).toBeDefined();
    expect(prisma.eiForecast.create).toHaveBeenCalled();
  });

  it("should list reports through the controller", async () => {
    prisma.eiEnterpriseReport.findMany.mockResolvedValue([]);

    const req = { user: { organizationId: "org-1" } };
    const reports = await controller.getReports(req);

    expect(Array.isArray(reports)).toBe(true);
    expect(prisma.eiEnterpriseReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
  });
});
