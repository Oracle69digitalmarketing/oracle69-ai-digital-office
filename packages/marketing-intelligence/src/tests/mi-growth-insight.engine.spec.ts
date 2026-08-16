import { jest } from "@jest/globals";
import { MiGrowthInsightEngine } from "../services/mi-growth-insight.engine.js";
import { MarketingIntelligenceEventType } from "../events/mi.events.js";

describe("MiGrowthInsightEngine", () => {
  let engine: MiGrowthInsightEngine;
  let modelProvider: any;
  let campaignEngine: any;
  let seoEngine: any;
  let conversionEngine: any;
  let messageBus: any;
  let memory: any;
  let prisma: any;

  const campaign = {
    period: "Q3 2026",
    totals: { leads: 2, conversions: 1, spend: 1000, revenueAttributed: 2000 },
    channels: [
      {
        channel: "seo",
        leads: 1,
        conversions: 1,
        conversionRate: 0.5,
        revenueAttributed: 2000,
        spend: 0,
        roas: 0,
        cac: 0,
        costPerLead: 0,
      },
      {
        channel: "paid",
        leads: 1,
        conversions: 0,
        conversionRate: 0,
        revenueAttributed: 0,
        spend: 1000,
        roas: 0.5,
        cac: 0,
        costPerLead: 1000,
      },
    ],
  };
  const seo = {
    organicLeads: 1,
    organicShare: 0.5,
    avgPosition: 11.5,
    keywordsTracked: 11,
    metrics: { organicVisits: 120 },
  };
  const conversion = {
    totalLeads: 2,
    conversions: 1,
    conversionRate: 0.5,
    bestSource: "seo",
    weakestSource: "paid",
    sources: [],
    funnel: { visitors: 200, leads: 2, mql: 1, sql: 1, converted: 0 },
  };

  beforeEach(() => {
    modelProvider = { analyze: jest.fn() };
    campaignEngine = { compute: jest.fn().mockResolvedValue(campaign) };
    seoEngine = { compute: jest.fn().mockResolvedValue(seo) };
    conversionEngine = { compute: jest.fn().mockResolvedValue(conversion) };
    messageBus = { publish: jest.fn() };
    memory = { save: jest.fn().mockResolvedValue(undefined) };

    engine = new MiGrowthInsightEngine(
      modelProvider,
      campaignEngine,
      seoEngine,
      conversionEngine,
      messageBus,
      memory,
    );
    prisma = (engine as any).prisma;
    prisma.crmLead.findMany = jest.fn().mockResolvedValue([]);
    prisma.crmOpportunity.findMany = jest.fn().mockResolvedValue([]);
    prisma.miGrowthInsight.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.miPricingSuggestion.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.miGrowthInsight.findMany = jest.fn().mockResolvedValue([]);
    prisma.miPricingSuggestion.findMany = jest.fn().mockResolvedValue([]);
  });

  it("should generate AI growth insights, persist them, save memory and publish events", async () => {
    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        insights: [
          { type: "campaign", content: "Paid channels are under-performing.", confidence: 0.9 },
        ],
        recommendations: [
          {
            title: "Shift budget",
            priority: "high",
            action: "Move spend to referral.",
            expectedImpact: "Higher ROAS",
          },
        ],
        contentBriefs: [
          {
            channel: "email",
            topic: "Spring newsletter",
            targetAudience: "Prospects",
            keyPoints: ["Point A", "Point B"],
          },
        ],
        pricingSuggestions: [
          {
            product: "Enterprise Plan",
            currentPrice: 50000,
            suggestedPrice: 52500,
            rationale: "Value alignment",
            confidence: 0.8,
          },
        ],
      }),
    });

    const result = await engine.generateGrowthInsights("org-1");

    expect(result.source).toBe("ai");
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].source).toBe("ai");
    expect(result.recommendations[0].priority).toBe("high");
    expect(result.contentBriefs).toHaveLength(1);
    expect(result.pricingSuggestions).toHaveLength(1);

    expect(prisma.miGrowthInsight.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ organizationId: "org-1", source: "ai" }),
      ]),
    });
    expect(prisma.miPricingSuggestion.createMany).toHaveBeenCalled();
    expect(memory.save).toHaveBeenCalledWith(expect.objectContaining({ type: "business" }));
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.INSIGHT_GENERATED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.INSIGHT_GENERATED }),
    );
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.PRICING_SUGGESTION_GENERATED,
      expect.objectContaining({
        type: MarketingIntelligenceEventType.PRICING_SUGGESTION_GENERATED,
      }),
    );
  });

  it("should fall back to deterministic insights when the model call fails", async () => {
    modelProvider.analyze.mockRejectedValue(new Error("provider unavailable"));

    const result = await engine.generateGrowthInsights("org-1");

    expect(result.source).toBe("deterministic");
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.every((i: any) => i.source === "deterministic")).toBe(true);
    expect(prisma.miGrowthInsight.createMany).toHaveBeenCalled();
    expect(memory.save).toHaveBeenCalled();
  });

  it("should fall back to deterministic insights when the model returns invalid JSON", async () => {
    modelProvider.analyze.mockResolvedValue({ content: "not json at all" });

    const result = await engine.generateGrowthInsights("org-1");

    expect(result.source).toBe("deterministic");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should fall back when the model returns empty arrays", async () => {
    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        insights: [],
        recommendations: [],
        contentBriefs: [],
        pricingSuggestions: [],
      }),
    });

    const result = await engine.generateGrowthInsights("org-1");

    expect(result.source).toBe("deterministic");
  });

  it("should produce deterministic pricing suggestions from won opportunities", async () => {
    modelProvider.analyze.mockRejectedValue(new Error("provider unavailable"));
    prisma.crmOpportunity.findMany = jest
      .fn()
      .mockResolvedValue([{ name: "Enterprise Plan", value: 50000 }]);

    const result = await engine.generateGrowthInsights("org-1");

    expect(result.pricingSuggestions).toHaveLength(1);
    expect(result.pricingSuggestions[0].product).toBe("Enterprise Plan");
    expect(result.pricingSuggestions[0].source).toBe("deterministic");
    expect(prisma.miPricingSuggestion.createMany).toHaveBeenCalled();
  });

  it("should propagate errors from the underlying compute engines", async () => {
    campaignEngine.compute.mockRejectedValue(new Error("Organization not found"));

    await expect(engine.generateGrowthInsights("missing-org")).rejects.toThrow(
      "Organization not found",
    );
    expect(prisma.miGrowthInsight.createMany).not.toHaveBeenCalled();
  });

  it("should list persisted insights and pricing suggestions", async () => {
    prisma.miGrowthInsight.findMany = jest.fn().mockResolvedValue([{ id: "i1" }]);
    prisma.miPricingSuggestion.findMany = jest.fn().mockResolvedValue([{ id: "p1" }]);

    await expect(engine.listInsights("org-1")).resolves.toHaveLength(1);
    await expect(engine.listPricingSuggestions("org-1")).resolves.toHaveLength(1);
  });
});
