import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import {
  EnterpriseIntelligenceEventType,
  EnterpriseIntelligenceEvent,
} from "../events/ei.events.js";
import { currentPeriod } from "../utils/period.js";

export interface EnterpriseForecast {
  period: string;
  expectedRevenue: number;
  weightedPipeline: number;
  committedRevenue: number;
  conservative: number;
  bestCase: number;
  retentionRevenue: number;
  assumptions: Record<string, unknown>;
}

const RETENTION_TIERS = {
  healthy: 0.95,
  atRisk: 0.8,
  critical: 0.5,
  unknown: 0.5,
};

/**
 * Generates a deterministic cross-domain revenue forecast that combines the
 * weighted sales pipeline (Sprint 8.2) with expected retained revenue derived
 * from customer health tiers (Sprint 8.3).
 */
@Injectable()
export class EiForecastEngine {
  private readonly logger = new Logger(EiForecastEngine.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly messageBus: MessageBus,
    @Optional() @Inject("PrismaService") prismaService?: PrismaClient,
  ) {
    this.prisma = prismaService ?? new PrismaClient();
  }

  /**
   * Deterministically computes the enterprise forecast without side effects.
   */
  async compute(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<EnterpriseForecast> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        crmOpportunities: true,
        crmOrganizations: {
          include: { opportunities: true },
        },
      },
    });

    if (!organization) throw new Error("Organization not found");

    const opportunities = organization.crmOpportunities;
    const openOpportunities = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");
    const wonOpportunities = opportunities.filter((o) => o.stage === "won");

    const openValue = openOpportunities.reduce((sum, o) => sum + o.value, 0);
    const weightedPipeline = openOpportunities.reduce(
      (sum, o) => sum + o.value * (o.probability || 0.5),
      0,
    );
    const wonRevenue = wonOpportunities.reduce((sum, o) => sum + o.value, 0);

    let retentionRevenue = 0;
    for (const account of organization.crmOrganizations) {
      const accountWonRevenue = account.opportunities
        .filter((o) => o.stage === "won")
        .reduce((sum, o) => sum + o.value, 0);
      if (accountWonRevenue === 0) continue;

      const health = account.healthScore;
      let factor = RETENTION_TIERS.unknown;
      if (health !== null && health !== undefined) {
        factor =
          health >= 75
            ? RETENTION_TIERS.healthy
            : health >= 45
              ? RETENTION_TIERS.atRisk
              : RETENTION_TIERS.critical;
      }
      retentionRevenue += accountWonRevenue * factor;
    }

    return {
      period,
      expectedRevenue: round(wonRevenue + weightedPipeline),
      weightedPipeline: round(weightedPipeline),
      committedRevenue: round(wonRevenue + weightedPipeline * 0.4),
      conservative: round(wonRevenue + weightedPipeline * 0.2),
      bestCase: round(wonRevenue + openValue * 0.8),
      retentionRevenue: round(retentionRevenue),
      assumptions: {
        winProbabilityDefault: 0.5,
        commitFactor: 0.4,
        conservativeFactor: 0.2,
        bestCaseFactor: 0.8,
        retentionTiers: RETENTION_TIERS,
      },
    };
  }

  /**
   * Computes, persists and publishes the enterprise forecast.
   */
  async generateForecast(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<EnterpriseForecast> {
    this.logger.log(
      `Generating enterprise forecast for organization ${organizationId}, period ${period}`,
    );

    const forecast = await this.compute(organizationId, period);

    await this.prisma.eiForecast.create({
      data: {
        organizationId,
        period,
        expectedRevenue: forecast.expectedRevenue,
        weightedPipeline: forecast.weightedPipeline,
        committedRevenue: forecast.committedRevenue,
        conservative: forecast.conservative,
        bestCase: forecast.bestCase,
        retentionRevenue: forecast.retentionRevenue,
        assumptions: forecast.assumptions as unknown as object,
      },
    });

    this.messageBus.publish(
      EnterpriseIntelligenceEventType.FORECAST_UPDATED,
      new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.FORECAST_UPDATED, {
        organizationId,
        forecast,
      }),
    );

    return forecast;
  }
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
