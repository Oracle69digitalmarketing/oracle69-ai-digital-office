import { jest } from "@jest/globals";
import { EiKpiEngine } from "../services/ei-kpi.engine.js";
import { EnterpriseIntelligenceEventType } from "../events/ei.events.js";

describe("EiKpiEngine", () => {
  let engine: EiKpiEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new EiKpiEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.eiKpiSnapshot.create = jest.fn().mockResolvedValue({});
  });

  function mockOrganization(overrides: any = {}) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: "org-1",
      crmOpportunities: [],
      crmLeads: [],
      crmContacts: [],
      crmOrganizations: [],
      ...overrides,
    });
  }

  it("should compute enterprise KPIs from real CRM, sales and customer-success data", async () => {
    mockOrganization({
      crmOpportunities: [
        { value: 100000, stage: "open", probability: 0.5 },
        { value: 50000, stage: "won" },
        { value: 20000, stage: "lost" },
      ],
      crmLeads: [{ status: "converted" }, { status: "new" }],
      crmContacts: [{ id: "c1" }],
      crmOrganizations: [
        { healthScore: 80, churnRisks: [], interactions: [] },
        {
          healthScore: 30,
          churnRisks: [{ severity: "high" }, { severity: "low" }],
          interactions: [{}, {}],
        },
      ],
    });

    const result = await engine.generateSnapshot("org-1", "Q3 2026");

    expect(result.totalPipelineValue).toBe(100000);
    expect(result.weightedPipeline).toBe(50000);
    expect(result.wonRevenue).toBe(50000);
    expect(result.winRate).toBe(0.5);
    expect(result.leadConversionRate).toBe(0.5);
    expect(result.totalContacts).toBe(1);
    expect(result.averageCustomerHealth).toBe(55);
    expect(result.accountsAtRisk).toBe(1);
    expect(result.criticalAccounts).toBe(1);
    expect(result.activeChurnRisks).toBe(1);
    expect(result.totalInteractions).toBe(2);

    expect(prisma.eiKpiSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: "org-1", period: "Q3 2026" }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.KPI_UPDATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.KPI_UPDATED }),
    );
  });

  it("should return zeroed metrics for an organization without CRM data", async () => {
    mockOrganization();

    const result = await engine.generateSnapshot("org-1");

    expect(result.totalOpportunities).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.averageCustomerHealth).toBe(0);
    expect(result.leadConversionRate).toBe(0);
    expect(result.activeAccounts).toBe(0);
  });

  it("should not count lost opportunities in the open pipeline", async () => {
    mockOrganization({
      crmOpportunities: [{ value: 5000, stage: "lost" }],
    });

    const result = await engine.generateSnapshot("org-1");

    expect(result.openOpportunities).toBe(0);
    expect(result.totalPipelineValue).toBe(0);
    expect(result.lostOpportunities).toBe(1);
  });

  it("should throw when the organization does not exist", async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateSnapshot("missing-org")).rejects.toThrow("Organization not found");
    expect(prisma.eiKpiSnapshot.create).not.toHaveBeenCalled();
  });
});
