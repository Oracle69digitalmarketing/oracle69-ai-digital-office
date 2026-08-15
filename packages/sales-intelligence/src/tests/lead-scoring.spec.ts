import { jest } from '@jest/globals';
import { TenantContextService } from '@oracle69/runtime';
import { LeadScoringEngine } from '../lead-scoring/lead-scoring.engine.js';
import { SalesIntelligenceEventType } from '../events/sales-intelligence.events.js';

describe('LeadScoringEngine', () => {
  let engine: LeadScoringEngine;
  let modelProvider: any;
  let messageBus: any;
  let tenantContextService: any;

  beforeEach(() => {
    modelProvider = {
      analyze: jest.fn(),
    };
    messageBus = {
      publish: jest.fn(),
    };
    tenantContextService = {
      resolveTenantId: jest.fn().mockReturnValue('tenant-a'),
    };
    engine = new LeadScoringEngine(modelProvider, messageBus, tenantContextService);
  });

  it('should score a lead and publish an event', async () => {
    const leadId = 'lead-123';
    const mockLead = {
      id: leadId,
      source: 'referral',
      crmOrganization: { revenue: 2000000 },
      activities: [{}, {}, {}, {}, {}, {}],
      notes: [],
    };

    (engine as any).prisma.crmLead.findUnique = jest.fn().mockResolvedValue(mockLead);
    (engine as any).prisma.crmLead.update = jest.fn().mockResolvedValue(mockLead);

    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        score: 80,
        grade: 'A',
        status: 'qualified',
        recommendedAction: 'Contact immediately',
        confidence: 0.9,
        reasoning: ['High revenue', 'Strong engagement'],
      }),
    });

    const result = await engine.scoreLead(leadId);

    expect(result).toBeDefined();
    expect(result?.grade).toBe('A');
    expect(messageBus.publish).toHaveBeenCalledWith(
      SalesIntelligenceEventType.LEAD_SCORED,
      expect.objectContaining({ type: SalesIntelligenceEventType.LEAD_SCORED })
    );
  });
});
