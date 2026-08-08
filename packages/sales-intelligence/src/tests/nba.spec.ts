import { jest } from '@jest/globals';
import { NextBestActionEngine } from '../next-best-action/nba.engine.js';
import { SalesIntelligenceEventType } from '../events/sales-intelligence.events.js';

describe('NextBestActionEngine', () => {
  let engine: NextBestActionEngine;
  let modelProvider: any;
  let messageBus: any;

  beforeEach(() => {
    modelProvider = {
      analyze: jest.fn(),
    };
    messageBus = {
      publish: jest.fn(),
    };
    engine = new NextBestActionEngine(modelProvider, messageBus);
  });

  it('should recommend next action and publish an event', async () => {
    const leadId = 'lead-123';
    (engine as any).prisma.crmLead.findUnique = jest.fn().mockResolvedValue({ id: leadId });

    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        action: 'Send technical proposal',
        priority: 'high',
        reason: 'Client requested specific technical details',
        expectedOutcome: 'Move to negotiation stage',
        confidence: 0.95,
      }),
    });

    const result = await engine.recommendNextAction('lead', leadId);

    expect(result).toBeDefined();
    expect(result?.priority).toBe('high');
    expect(messageBus.publish).toHaveBeenCalledWith(
      SalesIntelligenceEventType.NEXT_BEST_ACTION_GENERATED,
      expect.objectContaining({ type: SalesIntelligenceEventType.NEXT_BEST_ACTION_GENERATED })
    );
  });
});
