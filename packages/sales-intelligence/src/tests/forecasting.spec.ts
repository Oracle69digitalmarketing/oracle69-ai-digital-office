import { jest } from '@jest/globals';
import { ForecastingEngine } from '../forecasting/forecasting.engine.js';
import { SalesIntelligenceEventType } from '../events/sales-intelligence.events.js';
import { TenantContextService } from '@oracle69/runtime';

describe('ForecastingEngine', () => {
  let engine: ForecastingEngine;
  let messageBus: any;
  let tenantContextService: any;

  beforeEach(() => {
    messageBus = {
      publish: jest.fn(),
    };
    tenantContextService = {
      resolveTenantId: jest.fn().mockReturnValue('tenant-a'),
    };
    engine = new ForecastingEngine(messageBus, tenantContextService);
  });

  it('should generate a forecast and publish an event', async () => {
    const mockOpps = [
      { value: 100000, probability: 0.5, stage: 'discovery' },
      { value: 200000, probability: 0.8, stage: 'negotiation' },
    ];

    (engine as any).prisma.crmOpportunity.findMany = jest.fn().mockResolvedValue(mockOpps);

    const result = await engine.generateForecast('org-123', 'Q3 2026');

    expect(result.weightedPipeline).toBe(210000);
    expect(messageBus.publish).toHaveBeenCalledWith(
      SalesIntelligenceEventType.FORECAST_UPDATED,
      expect.objectContaining({ type: SalesIntelligenceEventType.FORECAST_UPDATED })
    );
  });
});
