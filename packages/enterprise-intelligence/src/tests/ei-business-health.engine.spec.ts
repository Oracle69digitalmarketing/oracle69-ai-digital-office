import { jest } from '@jest/globals';
import { EiBusinessHealthEngine } from '../services/ei-business-health.engine.js';
import { EnterpriseIntelligenceEventType } from '../events/ei.events.js';

describe('EiBusinessHealthEngine', () => {
  let engine: EiBusinessHealthEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new EiBusinessHealthEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.eiBusinessHealthSnapshot.findFirst = jest.fn().mockResolvedValue(null);
    prisma.eiBusinessHealthSnapshot.create = jest.fn().mockResolvedValue({});
  });

  function mockOrganization(overrides: any = {}) {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({
      id: 'org-1',
      crmOpportunities: [],
      crmContacts: [],
      crmOrganizations: [],
      ...overrides,
    });
  }

  it('should score a healthy enterprise and publish an update event', async () => {
    mockOrganization({
      crmOpportunities: [{ stage: 'won' }, { stage: 'won' }, { stage: 'open' }],
      crmContacts: [{ id: 'c1' }],
      crmOrganizations: [
        { healthScore: 90, churnRisks: [], interactions: [{}, {}, {}, {}, {}] },
        { healthScore: 80, churnRisks: [], interactions: [{}, {}, {}] },
      ],
    });

    const result = await engine.generateSnapshot('org-1');

    expect(result.status).toBe('healthy');
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.factors.length).toBeGreaterThan(0);

    expect(prisma.eiBusinessHealthSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', score: result.score, status: 'healthy' }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.BUSINESS_HEALTH_UPDATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.BUSINESS_HEALTH_UPDATED })
    );
  });

  it('should mark an enterprise critical when churn signals and losses dominate', async () => {
    mockOrganization({
      crmOpportunities: [{ stage: 'lost' }],
      crmContacts: [],
      crmOrganizations: [
        { healthScore: 30, churnRisks: [{ severity: 'critical' }], interactions: [] },
      ],
    });

    const result = await engine.generateSnapshot('org-1');

    expect(result.status).toBe('critical');
    expect(result.score).toBeLessThan(45);
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.BUSINESS_HEALTH_DETERIORATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.BUSINESS_HEALTH_DETERIORATED })
    );
  });

  it('should flag deterioration when the new score is lower than the previous snapshot', async () => {
    mockOrganization({
      crmOpportunities: [{ stage: 'won' }],
      crmContacts: [{ id: 'c1' }],
      crmOrganizations: [{ healthScore: 80, churnRisks: [], interactions: [{}, {}] }],
    });
    prisma.eiBusinessHealthSnapshot.findFirst = jest.fn().mockResolvedValue({ id: 'snap-1', score: 90 });

    const result = await engine.generateSnapshot('org-1');

    expect(result.score).toBeLessThan(90);
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.BUSINESS_HEALTH_DETERIORATED,
      expect.objectContaining({
        type: EnterpriseIntelligenceEventType.BUSINESS_HEALTH_DETERIORATED,
        payload: expect.objectContaining({ previousScore: 90 }),
      })
    );
  });

  it('should throw when the organization does not exist', async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateSnapshot('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.eiBusinessHealthSnapshot.create).not.toHaveBeenCalled();
  });
});
