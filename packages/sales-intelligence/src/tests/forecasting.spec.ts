import { jest } from '@jest/globals';
import { ForecastingEngine } from '../forecasting/forecasting.engine.js';
import { SalesIntelligenceEventType } from '../events/sales-intelligence.events.js';

describe('ForecastingEngine', () => {
  let engine: ForecastingEngine;
  let messageBus: any;

  beforeEach(() => {
    messageBus = {
      publish: jest.fn(),
    };
    engine = new ForecastingEngine(messageBus);
  });

  it('should generate a forecast and publish an event', async () => {
    const orgId = 'org-123';
    const mockOpps = [
      { id: '1', value: 100000, probability: 0.5, stage: 'pipeline' },
      { id: '2', value: 50000, probability: 1.0, stage: 'won' },
    ];

    (engine as any).prisma.crmOpportunity.findMany = jest.fn().mockResolvedValue(mockOpps);

    const result = await engine.generateForecast(orgId, 'Q3 2026');

    expect(result).toBeDefined();
    expect(result.weightedPipeline).toBe(100000); // 100k*0.5 + 50k*1.0
    expect(result.commit).toBeGreaterThan(50000);
    expect(messageBus.publish).toHaveBeenCalledWith(
      SalesIntelligenceEventType.FORECAST_UPDATED,
      expect.objectContaining({ type: SalesIntelligenceEventType.FORECAST_UPDATED })
    );
  });
});
