import { jest } from "@jest/globals";
import { MiReportService } from "../services/mi-report.service.js";
import { MissionStatus } from "@oracle69/runtime";
import { MarketingIntelligenceEventType } from "../events/mi.events.js";

describe("MiReportService", () => {
  let service: MiReportService;
  let campaignEngine: any;
  let seoEngine: any;
  let conversionEngine: any;
  let missionManager: any;
  let messageBus: any;
  let prisma: any;

  const campaign = {
    period: "Q3 2026",
    totals: { leads: 10, conversions: 5, spend: 1000, revenueAttributed: 3000 },
    channels: [
      { channel: "seo", leads: 5, conversions: 3, conversionRate: 0.6, spend: 0, roas: 0 },
      { channel: "paid", leads: 5, conversions: 2, conversionRate: 0.4, spend: 1000, roas: 3 },
    ],
  };
  const seo = {
    organicLeads: 5,
    organicShare: 0.5,
    avgPosition: 11,
    keywordsTracked: 15,
    metrics: {},
  };
  const conversion = {
    totalLeads: 10,
    conversions: 5,
    conversionRate: 0.5,
    bestSource: "seo",
    weakestSource: "paid",
    sources: [],
    funnel: {},
  };

  beforeEach(() => {
    campaignEngine = { compute: jest.fn().mockResolvedValue(campaign) };
    seoEngine = { compute: jest.fn().mockResolvedValue(seo) };
    conversionEngine = { compute: jest.fn().mockResolvedValue(conversion) };
    missionManager = { createMission: jest.fn().mockResolvedValue(undefined) };
    messageBus = { publish: jest.fn() };

    service = new MiReportService(
      campaignEngine,
      seoEngine,
      conversionEngine,
      missionManager,
      messageBus,
    );
    prisma = (service as any).prisma;
    prisma.miGrowthReport.create = jest
      .fn()
      .mockResolvedValue({ id: "report-1", period: "Q3 2026" });
    prisma.miGrowthReport.findMany = jest.fn().mockResolvedValue([]);
  });

  it("should compose a healthy growth report and publish an event without escalation", async () => {
    const report = await service.generateReport("org-1", "Q3 2026");

    expect(report.period).toBe("Q3 2026");
    expect(report.summary).toEqual(expect.objectContaining({ campaign, seo, conversion }));
    expect(report.summary.growthScore).toBeGreaterThanOrEqual(75);

    expect(prisma.miGrowthReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: "org-1", period: "Q3 2026" }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.REPORT_GENERATED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.REPORT_GENERATED }),
    );
    expect(missionManager.createMission).not.toHaveBeenCalled();
  });

  it("should escalate a growth mission when there is no inbound lead volume", async () => {
    campaignEngine.compute.mockResolvedValue({
      period: "Q3 2026",
      totals: { leads: 0, conversions: 0, spend: 0, revenueAttributed: 0 },
      channels: campaign.channels.map((c: any) => ({
        ...c,
        leads: 0,
        conversions: 0,
        conversionRate: 0,
        spend: 0,
        roas: 0,
      })),
    });
    conversionEngine.compute.mockResolvedValue({
      ...conversion,
      totalLeads: 0,
      conversions: 0,
      conversionRate: 0,
    });

    await service.generateReport("org-1");

    expect(missionManager.createMission).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "critical",
        owner: "marketing-intelligence",
        status: MissionStatus.DRAFT,
      }),
    );
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.GROWTH_ALERT_REQUIRED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.GROWTH_ALERT_REQUIRED }),
    );
  });

  it("should throw when the organization does not exist", async () => {
    campaignEngine.compute.mockRejectedValue(new Error("Organization not found"));

    await expect(service.generateReport("missing-org")).rejects.toThrow("Organization not found");
    expect(prisma.miGrowthReport.create).not.toHaveBeenCalled();
  });

  it("should list persisted growth reports", async () => {
    prisma.miGrowthReport.findMany = jest.fn().mockResolvedValue([{ id: "r1" }, { id: "r2" }]);

    await expect(service.listReports("org-1")).resolves.toHaveLength(2);
  });
});
