import { jest } from "@jest/globals";
import { EiScenarioEngine } from "../services/ei-scenario.engine.js";
import { EnterpriseIntelligenceEventType } from "../events/ei.events.js";

describe("EiScenarioEngine", () => {
  let engine: EiScenarioEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new EiScenarioEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.eiScenario.create = jest.fn().mockResolvedValue({});
  });

  function mockOrganization(overrides: any = {}) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: "org-1",
      crmOpportunities: [],
      crmOrganizations: [],
      ...overrides,
    });
  }

  it("should project a revenue uplift from a win-rate improvement", async () => {
    mockOrganization({
      crmOpportunities: [
        { value: 100000, stage: "open" },
        { value: 50000, stage: "won" },
        { value: 50000, stage: "lost" },
      ],
      crmOrganizations: [{ healthScore: 90, opportunities: [{ value: 50000, stage: "won" }] }],
    });

    const result = await engine.runScenario("org-1", {
      name: "Improved win rate",
      winRateDelta: 0.5,
    });

    expect(result.scenarioType).toBe("win_rate");
    expect(result.name).toBe("Improved win rate");
    expect(result.projections.projectedWinRate).toBe(1);
    expect(result.projections.projectedPipelineRevenue).toBe(100000);
    expect(result.projections.revenueDelta).toBe(50000);

    expect(prisma.eiScenario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: "org-1", scenarioType: "win_rate" }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.SCENARIO_CREATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.SCENARIO_CREATED }),
    );
  });

  it("should classify combined scenarios and reduce at-risk retention exposure", async () => {
    mockOrganization({
      crmOpportunities: [{ value: 100000, stage: "won" }],
      crmOrganizations: [{ healthScore: 40, opportunities: [{ value: 100000, stage: "won" }] }],
    });

    const result = await engine.runScenario("org-1", {
      churnReduction: 0.2,
      engagementIncrease: 0.1,
    });

    expect(result.scenarioType).toBe("combined");
    expect(result.projections.projectedRetentionRevenue).toBe(100000 * 0.5 + 100000 * 0.2);
    expect(result.projections.projectedTotalRevenue).toBeGreaterThan(0);
  });

  it("should reject out-of-range scenario parameters", async () => {
    await expect(engine.runScenario("org-1", { winRateDelta: 2 })).rejects.toThrow(
      "Invalid scenario parameter",
    );
    await expect(engine.runScenario("org-1", { averageDealValueDelta: -1 })).rejects.toThrow(
      "Invalid scenario parameter",
    );
    await expect(engine.runScenario("org-1", { churnReduction: 1.5 })).rejects.toThrow(
      "Invalid scenario parameter",
    );
    expect(prisma.eiScenario.create).not.toHaveBeenCalled();
  });

  it("should throw when the organization does not exist", async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.runScenario("missing-org", {})).rejects.toThrow("Organization not found");
  });
});
