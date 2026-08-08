import { jest } from '@jest/globals';
import { MiSeoEngine } from '../services/mi-seo.engine.js';
import { MarketingIntelligenceEventType } from '../events/mi.events.js';

describe('MiSeoEngine', () => {
  let engine: MiSeoEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new MiSeoEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.miSeoSnapshot.findFirst = jest.fn().mockResolvedValue(null);
    prisma.miSeoSnapshot.create = jest.fn().mockResolvedValue({});
    prisma.miSeoSnapshot.findMany = jest.fn().mockResolvedValue([]);
  });

  function mockOrganization(leads: any[] = []) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: 'org-1',
      crmLeads: leads,
    });
  }

  it('should compute SEO metrics from organic lead sources and persist a snapshot', async () => {
    mockOrganization([
      { source: 'seo' },
      { source: 'organic' },
      { source: 'paid' },
    ]);

    const result = await engine.generateSnapshot('org-1', 'Q3 2026');

    expect(result.organicLeads).toBe(2);
    expect(result.organicShare).toBeCloseTo(0.6667, 4);
    expect(result.avgPosition).toBe(12);
    expect(result.keywordsTracked).toBe(12);
    expect(result.metrics.organicVisits).toBe(240);
    expect(result.metrics.rankingsDistribution).toHaveLength(5);

    expect(prisma.miSeoSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', period: 'Q3 2026', organicLeads: 2 }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.SEO_UPDATED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.SEO_UPDATED })
    );
  });

  it('should trend the average position against the previous snapshot', async () => {
    mockOrganization([
      { source: 'seo' },
      { source: 'seo' },
      { source: 'paid' },
    ]);
    prisma.miSeoSnapshot.findFirst = jest.fn().mockResolvedValue({
      id: 'snap-1',
      avgPosition: 12,
      metrics: { organicVisits: 120 },
    });

    const result = await engine.compute('org-1');

    expect(result.avgPosition).toBe(11.5);
    expect(result.metrics.previousAvgPosition).toBe(12);
  });

  it('should return zeroed SEO metrics when there is no data', async () => {
    mockOrganization([]);

    const result = await engine.compute('org-1');

    expect(result.organicLeads).toBe(0);
    expect(result.organicShare).toBe(0);
    expect(result.keywordsTracked).toBe(10);
  });

  it('should throw when the organization does not exist', async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateSnapshot('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.miSeoSnapshot.create).not.toHaveBeenCalled();
  });

  it('should list persisted SEO snapshots', async () => {
    prisma.miSeoSnapshot.findMany = jest.fn().mockResolvedValue([{ id: 's1' }]);

    await expect(engine.listSnapshots('org-1')).resolves.toHaveLength(1);
  });
});
