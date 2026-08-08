import { jest } from '@jest/globals';
import { OpportunityEngine } from '../opportunity-scoring/opportunity.engine.js';
import { SalesIntelligenceEventType } from '../events/sales-intelligence.events.js';

describe('OpportunityEngine', () => {
  let engine: OpportunityEngine;
  let modelProvider: any;
  let messageBus: any;

  beforeEach(() => {
    modelProvider = {
      analyze: jest.fn(),
    };
    messageBus = {
      publish: jest.fn(),
    };
    engine = new OpportunityEngine(modelProvider, messageBus);
  });

  it('should analyze an opportunity and publish an event', async () => {
    const oppId = 'opp-123';
    const mockOpp = {
      id: oppId,
      name: 'Big Deal',
      value: 500000,
      stage: 'discovery',
      crmOrganization: { name: 'Acme' },
      activities: [],
      notes: [],
      contacts: [],
      pipeline: { stages: [] },
    };

    (engine as any).prisma.crmOpportunity.findUnique = jest.fn().mockResolvedValue(mockOpp);
    (engine as any).prisma.crmOpportunity.update = jest.fn().mockResolvedValue(mockOpp);

    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        opportunityScore: 75,
        winProbability: 0.6,
        dealVelocity: 'high',
        engagementLevel: 'medium',
        expectedCloseProbability: 0.5,
        anomalyDetected: false,
        reasoning: ['Strong interest'],
      }),
    });

    const result = await engine.analyzeOpportunity(oppId);

    expect(result).toBeDefined();
    expect(result?.winProbability).toBe(0.6);
    expect(messageBus.publish).toHaveBeenCalledWith(
      SalesIntelligenceEventType.OPPORTUNITY_SCORED,
      expect.objectContaining({ type: SalesIntelligenceEventType.OPPORTUNITY_SCORED })
    );
  });
});
