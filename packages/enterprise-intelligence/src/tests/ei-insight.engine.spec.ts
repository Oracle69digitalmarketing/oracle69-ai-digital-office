import { jest } from '@jest/globals';
import { EiInsightEngine } from '../services/ei-insight.engine.js';
import { EnterpriseIntelligenceEventType } from '../events/ei.events.js';

describe('EiInsightEngine', () => {
  let engine: EiInsightEngine;
  let modelProvider: any;
  let kpiEngine: any;
  let healthEngine: any;
  let forecastEngine: any;
  let messageBus: any;
  let memory: any;
  let prisma: any;

  const kpis = {
    totalOpportunities: 2,
    winRate: 0.5,
    averageCustomerHealth: 70,
    accountsAtRisk: 0,
    openOpportunities: 3,
    totalInteractions: 5,
  };

  beforeEach(() => {
    modelProvider = { analyze: jest.fn() };
    kpiEngine = { compute: jest.fn().mockResolvedValue(kpis) };
    healthEngine = { compute: jest.fn().mockResolvedValue({ status: 'healthy', score: 80, reasoning: 'ok', factors: [] }) };
    forecastEngine = { compute: jest.fn().mockResolvedValue({ expectedRevenue: 150000, period: 'Q3 2026' }) };
    messageBus = { publish: jest.fn() };
    memory = { save: jest.fn().mockResolvedValue(undefined) };

    engine = new EiInsightEngine(modelProvider, kpiEngine, healthEngine, forecastEngine, messageBus, memory);
    prisma = (engine as any).prisma;
    prisma.eiInsight.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.eiRecommendation.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.eiInsight.findMany = jest.fn().mockResolvedValue([]);
    prisma.eiRecommendation.findMany = jest.fn().mockResolvedValue([]);
  });

  it('should generate AI insights, persist them, save to memory and publish events', async () => {
    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        insights: [{ type: 'forecast', content: 'Revenue is expected to grow this quarter.', confidence: 0.9 }],
        recommendations: [{ title: 'Expand pipeline', priority: 'high', action: 'Launch outbound campaigns.', expectedImpact: '+20% pipeline' }],
      }),
    });

    const result = await engine.generateInsights('org-1');

    expect(result.source).toBe('ai');
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].source).toBe('ai');
    expect(result.recommendations[0].priority).toBe('high');

    expect(prisma.eiInsight.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ organizationId: 'org-1', source: 'ai', type: 'forecast' }),
      ]),
    });
    expect(prisma.eiRecommendation.createMany).toHaveBeenCalled();
    expect(memory.save).toHaveBeenCalledWith(expect.objectContaining({ type: 'business' }));
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.INSIGHT_GENERATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.INSIGHT_GENERATED })
    );
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.RECOMMENDATION_GENERATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.RECOMMENDATION_GENERATED })
    );
  });

  it('should fall back to deterministic insights when the model call fails', async () => {
    modelProvider.analyze.mockRejectedValue(new Error('provider unavailable'));

    const result = await engine.generateInsights('org-1');

    expect(result.source).toBe('deterministic');
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.every((i: any) => i.source === 'deterministic')).toBe(true);
    expect(prisma.eiInsight.createMany).toHaveBeenCalled();
    expect(memory.save).toHaveBeenCalled();
  });

  it('should fall back to deterministic insights when the model returns invalid JSON', async () => {
    modelProvider.analyze.mockResolvedValue({ content: 'this is not JSON' });

    const result = await engine.generateInsights('org-1');

    expect(result.source).toBe('deterministic');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should fall back when the model returns empty arrays', async () => {
    modelProvider.analyze.mockResolvedValue({ content: JSON.stringify({ insights: [], recommendations: [] }) });

    const result = await engine.generateInsights('org-1');

    expect(result.source).toBe('deterministic');
  });

  it('should produce a critical retention recommendation when business health is critical', async () => {
    modelProvider.analyze.mockRejectedValue(new Error('provider unavailable'));
    healthEngine.compute.mockResolvedValue({ status: 'critical', score: 30, reasoning: 'bad', factors: [] });

    const result = await engine.generateInsights('org-1');

    const critical = result.recommendations.find((r: any) => r.priority === 'critical');
    expect(critical).toBeDefined();
    expect(critical.action).toContain('intervention');
  });

  it('should propagate errors from the underlying compute engines', async () => {
    kpiEngine.compute.mockRejectedValue(new Error('Organization not found'));

    await expect(engine.generateInsights('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.eiInsight.createMany).not.toHaveBeenCalled();
  });

  it('should list persisted insights and recommendations', async () => {
    prisma.eiInsight.findMany = jest.fn().mockResolvedValue([{ id: 'i1' }]);
    prisma.eiRecommendation.findMany = jest.fn().mockResolvedValue([{ id: 'r1' }]);

    await expect(engine.listInsights('org-1')).resolves.toHaveLength(1);
    await expect(engine.listRecommendations('org-1')).resolves.toHaveLength(1);
  });
});
