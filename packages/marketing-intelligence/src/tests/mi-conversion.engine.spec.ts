import { jest } from '@jest/globals';
import { MiConversionEngine } from '../services/mi-conversion.engine.js';
import { MarketingIntelligenceEventType } from '../events/mi.events.js';

describe('MiConversionEngine', () => {
  let engine: MiConversionEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new MiConversionEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.miConversionSnapshot.create = jest.fn().mockResolvedValue({});
    prisma.miConversionSnapshot.findMany = jest.fn().mockResolvedValue([]);
  });

  function mockOrganization(leads: any[] = []) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: 'org-1',
      crmLeads: leads,
    });
  }

  it('should compute conversion metrics per source and persist a snapshot', async () => {
    mockOrganization([
      { source: 'seo', status: 'qualified', score: 80 },
      { source: 'seo', status: 'new', score: 50 },
      { source: 'paid', status: 'converted', score: 90 },
    ]);

    const result = await engine.generateSnapshot('org-1', 'Q3 2026');

    expect(result.totalLeads).toBe(3);
    expect(result.qualifiedLeads).toBe(2);
    expect(result.conversions).toBe(2);
    expect(result.conversionRate).toBeCloseTo(0.6667, 4);
    expect(result.bestSource).toBe('paid');
    expect(result.weakestSource).toBe('seo');
    expect(result.funnel.visitors).toBe(300);
    expect(result.funnel.mql).toBe(2);
    expect(result.funnel.sql).toBe(2);
    expect(result.funnel.converted).toBe(1);

    expect(prisma.miConversionSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', period: 'Q3 2026', bestSource: 'paid' }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.CONVERSION_UPDATED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.CONVERSION_UPDATED })
    );
  });

  it('should return zeroed metrics when there are no leads', async () => {
    mockOrganization([]);

    const result = await engine.compute('org-1');

    expect(result.totalLeads).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.bestSource).toBeNull();
    expect(result.sources).toHaveLength(0);
  });

  it('should throw when the organization does not exist', async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateSnapshot('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.miConversionSnapshot.create).not.toHaveBeenCalled();
  });

  it('should list persisted conversion snapshots', async () => {
    prisma.miConversionSnapshot.findMany = jest.fn().mockResolvedValue([{ id: 'c1' }]);

    await expect(engine.listSnapshots('org-1')).resolves.toHaveLength(1);
  });
});
