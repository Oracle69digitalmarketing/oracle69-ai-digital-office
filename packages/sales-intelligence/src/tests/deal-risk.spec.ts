import { jest } from '@jest/globals';
import { DealRiskEngine } from '../deal-risk/deal-risk.engine.js';
import { SalesIntelligenceEventType } from '../events/sales-intelligence.events.js';

describe('DealRiskEngine', () => {
  let engine: DealRiskEngine;
  let modelProvider: any;
  let messageBus: any;

  beforeEach(() => {
    modelProvider = {
      analyze: jest.fn(),
    };
    messageBus = {
      publish: jest.fn(),
    };
    engine = new DealRiskEngine(modelProvider, messageBus);
  });

  it('should detect risks and publish an event', async () => {
    const oppId = 'opp-123';
    (engine as any).prisma.crmOpportunity.findUnique = jest.fn().mockResolvedValue({ id: oppId });

    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        risks: [
          {
            riskType: 'stalled_deal',
            severity: 'high',
            confidence: 0.85,
            evidence: ['No activity in 14 days'],
            recommendedAction: 'Schedule follow-up call',
          },
        ],
      }),
    });

    const result = await engine.detectRisks(oppId);

    expect(result).toHaveLength(1);
    expect(result?.[0].severity).toBe('high');
    expect(messageBus.publish).toHaveBeenCalledWith(
      SalesIntelligenceEventType.DEAL_RISK_DETECTED,
      expect.objectContaining({ type: SalesIntelligenceEventType.DEAL_RISK_DETECTED })
    );
  });
});
