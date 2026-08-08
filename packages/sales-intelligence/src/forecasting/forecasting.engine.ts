import { Injectable, Logger } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { SalesIntelligenceEventType, SalesIntelligenceEvent } from '../events/sales-intelligence.events.js';

export interface ForecastResult {
  weightedPipeline: number;
  expectedRevenue: number;
  bestCase: number;
  commit: number;
  conservative: number;
  forecastVariance: number;
  period: string;
}

@Injectable()
export class ForecastingEngine {
  private readonly logger = new Logger(ForecastingEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly messageBus: MessageBus
  ) {}

  async generateForecast(organizationId: string, period: string = 'Q3 2026'): Promise<ForecastResult> {
    this.logger.log(`Generating forecast for organization ${organizationId}, period ${period}`);

    const opportunities = await this.prisma.crmOpportunity.findMany({
      where: { organizationId },
      include: { pipeline: true },
    });

    let weightedPipeline = 0;
    let totalValue = 0;
    let wonValue = 0;

    opportunities.forEach(opp => {
      totalValue += opp.value;
      weightedPipeline += opp.value * (opp.probability || 0.5);
      if (opp.stage === 'won') wonValue += opp.value;
    });

    const forecast: ForecastResult = {
      weightedPipeline,
      expectedRevenue: weightedPipeline,
      bestCase: totalValue * 0.8,
      commit: wonValue + (weightedPipeline * 0.4),
      conservative: wonValue + (weightedPipeline * 0.2),
      forecastVariance: totalValue - weightedPipeline,
      period,
    };

    this.messageBus.publish(
      SalesIntelligenceEventType.FORECAST_UPDATED,
      new SalesIntelligenceEvent(SalesIntelligenceEventType.FORECAST_UPDATED, { organizationId, forecast })
    );

    return forecast;
  }
}
