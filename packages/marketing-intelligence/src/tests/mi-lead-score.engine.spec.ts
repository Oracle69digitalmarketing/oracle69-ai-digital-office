import { jest } from '@jest/globals';
import { MiLeadScoreEngine } from '../services/mi-lead-score.engine.js';
import { MarketingIntelligenceEventType } from '../events/mi.events.js';

describe('MiLeadScoreEngine', () => {
  let engine: MiLeadScoreEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new MiLeadScoreEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.crmLead.update = jest.fn().mockResolvedValue({});
    prisma.miLeadScore.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.miLeadScore.findMany = jest.fn().mockResolvedValue([]);
  });

  function mockOrganization(leads: any[] = []) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: 'org-1',
      crmLeads: leads,
    });
  }

  function lead(overrides: any) {
    return {
      id: 'l1',
      title: 'Acme',
      source: 'referral',
      status: 'new',
      score: null,
      crmOrganization: { revenue: 2000000, healthScore: 85 },
      activities: [],
      notes: [],
      ...overrides,
    };
  }

  it('should score leads, update CRM, persist scores and detect opportunities', async () => {
    mockOrganization([
      lead({ id: 'l1', source: 'referral', status: 'new', activities: [{}, {}], notes: [{}] }),
      lead({ id: 'l2', source: 'paid', status: 'new', crmOrganization: { revenue: 100000, healthScore: 80 }, activities: [{}] }),
      lead({ id: 'l3', title: 'Gamma', source: 'referral', status: 'qualified', activities: [{}, {}, {}, {}], notes: [{}] }),
      lead({ id: 'l4', title: 'Delta', source: 'paid', status: 'converted', crmOrganization: { revenue: 100000, healthScore: 60 }, activities: [{}] }),
    ]);

    const { summary, opportunities, results } = await engine.generate('org-1');

    expect(summary.scored).toBe(4);
    expect(summary.nurture).toBe(1);
    expect(summary.sql).toBe(1);
    expect(summary.disqualified).toBe(1);
    expect(summary.converted).toBe(1);
    expect(summary.opportunities).toBe(1);

    const l3 = results.find((r) => r.leadId === 'l3')!;
    expect(l3.status).toBe('sql');
    expect(l3.grade).toBe('B');
    expect(l3.score).toBe(78);

    expect(opportunities).toHaveLength(1);
    expect(opportunities[0].leadId).toBe('l3');

    expect(prisma.crmLead.update).toHaveBeenCalledWith({
      where: { id: 'l3' },
      data: { score: 78 },
    });
    expect(prisma.miLeadScore.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ organizationId: 'org-1', leadId: 'l3', status: 'sql' }),
      ]),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.LEAD_SCORED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.LEAD_SCORED })
    );
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.OPPORTUNITY_DETECTED,
      expect.objectContaining({
        type: MarketingIntelligenceEventType.OPPORTUNITY_DETECTED,
        payload: expect.objectContaining({ opportunities: expect.arrayContaining([expect.objectContaining({ leadId: 'l3' })]) }),
      })
    );
  });

  it('should score an empty lead base without detecting opportunities', async () => {
    mockOrganization([]);

    const { summary, opportunities } = await engine.generate('org-1');

    expect(summary.scored).toBe(0);
    expect(opportunities).toHaveLength(0);
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.LEAD_SCORED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.LEAD_SCORED })
    );
    expect(messageBus.publish).not.toHaveBeenCalledWith(
      MarketingIntelligenceEventType.OPPORTUNITY_DETECTED,
      expect.anything()
    );
  });

  it('should score a converted lead as converted regardless of score', async () => {
    mockOrganization([lead({ id: 'l9', status: 'converted', activities: [], notes: [] })]);

    const { results } = await engine.generate('org-1');

    expect(results[0].status).toBe('converted');
    expect(results[0].score).toBe(75);
  });

  it('should throw when the organization does not exist', async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generate('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.miLeadScore.createMany).not.toHaveBeenCalled();
  });

  it('should list persisted lead scores', async () => {
    prisma.miLeadScore.findMany = jest.fn().mockResolvedValue([{ id: 's1' }]);

    await expect(engine.listScores('org-1')).resolves.toHaveLength(1);
  });
});
