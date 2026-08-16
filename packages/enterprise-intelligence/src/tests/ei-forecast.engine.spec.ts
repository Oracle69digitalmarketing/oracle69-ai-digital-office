import { jest } from "@jest/globals";
import { EiForecastEngine } from "../services/ei-forecast.engine.js";
import { EnterpriseIntelligenceEventType } from "../events/ei.events.js";

describe("EiForecastEngine", () => {
  let engine: EiForecastEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new EiForecastEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.eiForecast.create = jest.fn().mockResolvedValue({});
  });

  function mockOrganization(overrides: any = {}) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: "org-1",
      crmOpportunities: [],
      crmOrganizations: [],
      ...overrides,
    });
  }

  it("should combine weighted pipeline with health-tiered retention revenue", async () => {
    mockOrganization({
      crmOpportunities: [
        { value: 100000, stage: "open", probability: 0.5 },
        { value: 50000, stage: "won" },
      ],
      crmOrganizations: [{ healthScore: 90, opportunities: [{ value: 50000, stage: "won" }] }],
    });

    const forecast = await engine.generateForecast("org-1", "Q3 2026");

    expect(forecast.weightedPipeline).toBe(50000);
    expect(forecast.expectedRevenue).toBe(100000);
    expect(forecast.retentionRevenue).toBe(47500);
    expect(forecast.period).toBe("Q3 2026");

    expect(prisma.eiForecast.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: "org-1", period: "Q3 2026" }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.FORECAST_UPDATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.FORECAST_UPDATED }),
    );
  });

  it("should apply the correct retention factor per customer health tier", async () => {
    mockOrganization({
      crmOpportunities: [],
      crmOrganizations: [
        { healthScore: 90, opportunities: [{ value: 100000, stage: "won" }] },
        { healthScore: 50, opportunities: [{ value: 50000, stage: "won" }] },
        { healthScore: 20, opportunities: [{ value: 20000, stage: "won" }] },
      ],
    });

    const forecast = await engine.generateForecast("org-1");

    expect(forecast.retentionRevenue).toBe(100000 * 0.95 + 50000 * 0.8 + 20000 * 0.5);
  });

  it("should produce a zero forecast for an organization with no pipeline or accounts", async () => {
    mockOrganization();

    const forecast = await engine.generateForecast("org-1");

    expect(forecast.expectedRevenue).toBe(0);
    expect(forecast.retentionRevenue).toBe(0);
  });

  it("should throw when the organization does not exist", async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateForecast("missing-org")).rejects.toThrow("Organization not found");
    expect(prisma.eiForecast.create).not.toHaveBeenCalled();
  });
});
