import { jest } from '@jest/globals';
import { MiCampaignEngine } from '../services/mi-campaign.engine.js';
import { MarketingIntelligenceEventType } from '../events/mi.events.js';

describe('MiCampaignEngine', () => {
  let engine: MiCampaignEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new MiCampaignEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.miCampaignMetric.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.miCampaign.create = jest.fn().mockResolvedValue({ id: 'campaign-1' });
    prisma.miCampaign.findMany = jest.fn().mockResolvedValue([]);
  });

  function mockOrganization(overrides: any = {}) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: 'org-1',
      crmLeads: [],
      crmOpportunities: [],
      miCampaigns: [],
      ...overrides,
    });
  }

  it('should compute per-channel metrics with attribution, ROAS and CAC and persist them', async () => {
    mockOrganization({
      crmLeads: [
        { source: 'referral', status: 'qualified' },
        { source: 'referral', status: 'new' },
        { source: 'paid', status: 'converted' },
      ],
      crmOpportunities: [
        { stage: 'won', value: 50000, contacts: [{ source: 'referral' }] },
        { stage: 'won', value: 10000, contacts: [{ source: 'paid' }] },
        { stage: 'lost', value: 99999, contacts: [{ source: 'referral' }] },
      ],
      miCampaigns: [
        { channel: 'referral', spent: 5000 },
        { channel: 'paid', spent: 2500 },
      ],
    });

    const result = await engine.generateMetrics('org-1', 'Q3 2026');

    const referral = result.channels.find((c) => c.channel === 'referral')!;
    const paid = result.channels.find((c) => c.channel === 'paid')!;

    expect(referral.leads).toBe(2);
    expect(referral.conversions).toBe(1);
    expect(referral.conversionRate).toBe(0.5);
    expect(referral.revenueAttributed).toBe(50000);
    expect(referral.spend).toBe(5000);
    expect(referral.roas).toBe(10);
    expect(referral.cac).toBe(5000);
    expect(referral.costPerLead).toBe(2500);

    expect(paid.leads).toBe(1);
    expect(paid.revenueAttributed).toBe(10000);
    expect(paid.roas).toBe(4);

    expect(result.totals.leads).toBe(3);
    expect(result.totals.conversions).toBe(2);
    expect(result.totals.spend).toBe(7500);

    expect(prisma.miCampaignMetric.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ organizationId: 'org-1', period: 'Q3 2026', channel: 'referral' }),
      ]),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.CAMPAIGN_METRICS_UPDATED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.CAMPAIGN_METRICS_UPDATED })
    );
  });

  it('should return zeroed metrics for an organization without marketing data', async () => {
    mockOrganization();

    const result = await engine.compute('org-1');

    expect(result.channels).toHaveLength(8);
    expect(result.channels.every((c) => c.leads === 0 && c.conversions === 0)).toBe(true);
    expect(result.totals.leads).toBe(0);
    expect(result.totals.spend).toBe(0);
  });

  it('should attribute organic source leads to the seo channel', async () => {
    mockOrganization({
      crmLeads: [{ source: 'organic', status: 'qualified' }, { source: 'google', status: 'new' }],
    });

    const result = await engine.compute('org-1');
    const seo = result.channels.find((c) => c.channel === 'seo')!;

    expect(seo.leads).toBe(2);
    expect(seo.conversions).toBe(1);
  });

  it('should create a campaign and publish a creation event', async () => {
    mockOrganization();

    const campaign = await engine.createCampaign('org-1', {
      name: 'Spring Launch',
      channel: 'email',
      budget: 10000,
      spent: 2000,
    });

    expect(campaign.id).toBe('campaign-1');
    expect(prisma.miCampaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', name: 'Spring Launch', channel: 'email', budget: 10000 }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      MarketingIntelligenceEventType.CAMPAIGN_CREATED,
      expect.objectContaining({ type: MarketingIntelligenceEventType.CAMPAIGN_CREATED })
    );
  });

  it('should reject a campaign without a name or channel', async () => {
    mockOrganization();

    await expect(engine.createCampaign('org-1', { name: '', channel: 'email' })).rejects.toThrow(
      'Invalid campaign: name is required'
    );
    await expect(engine.createCampaign('org-1', { name: 'X', channel: '' })).rejects.toThrow(
      'Invalid campaign: channel is required'
    );
  });

  it('should throw when the organization does not exist', async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateMetrics('missing-org')).rejects.toThrow('Organization not found');
    await expect(engine.createCampaign('missing-org', { name: 'X', channel: 'email' })).rejects.toThrow(
      'Organization not found'
    );
    expect(prisma.miCampaignMetric.createMany).not.toHaveBeenCalled();
  });

  it('should list persisted campaign metrics', async () => {
    prisma.miCampaignMetric.findMany = jest.fn().mockResolvedValue([{ id: 'm1' }]);

    await expect(engine.listMetrics('org-1')).resolves.toHaveLength(1);
  });
});
