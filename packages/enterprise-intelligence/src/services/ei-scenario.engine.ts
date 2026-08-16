import { Injectable, Logger } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import {
  EnterpriseIntelligenceEventType,
  EnterpriseIntelligenceEvent,
} from "../events/ei.events.js";

export interface ScenarioParameters {
  name?: string;
  winRateDelta?: number;
  averageDealValueDelta?: number;
  churnReduction?: number;
  engagementIncrease?: number;
}

export interface ScenarioProjections {
  currentExpectedRevenue: number;
  projectedPipelineRevenue: number;
  projectedRetentionRevenue: number;
  projectedTotalRevenue: number;
  revenueDelta: number;
  projectedWinRate: number;
}

export interface ScenarioResult {
  name: string;
  scenarioType: string;
  parameters: ScenarioParameters;
  projections: ScenarioProjections;
}

const RETENTION_TIERS = {
  healthy: 0.95,
  atRisk: 0.8,
  critical: 0.5,
  unknown: 0.5,
};

/**
 * Runs deterministic what-if scenario planning on enterprise data: changes to
 * the pipeline win rate, average deal value, churn exposure and engagement are
 * translated into projected revenue outcomes.
 */
@Injectable()
export class EiScenarioEngine {
  private readonly logger = new Logger(EiScenarioEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Runs a scenario against live enterprise data, persists the result and
   * publishes an event. The scenario parameters are validated before use.
   */
  async runScenario(
    organizationId: string,
    parameters: ScenarioParameters = {},
  ): Promise<ScenarioResult> {
    this.logger.log(`Running enterprise scenario for organization ${organizationId}`);

    validateParameters(parameters);

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
    const lostOpportunities = opportunities.filter((o) => o.stage === "lost");

    const openValue = openOpportunities.reduce((sum, o) => sum + o.value, 0);
    const wonRevenue = wonOpportunities.reduce((sum, o) => sum + o.value, 0);

    const wonLostTotal = wonOpportunities.length + lostOpportunities.length;
    const winRate = wonLostTotal > 0 ? wonOpportunities.length / wonLostTotal : 0;

    const projectedWinRate = Math.max(0, Math.min(1, winRate + (parameters.winRateDelta || 0)));

    let retentionRevenue = 0;
    let atRiskExposure = 0;
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

      if (health === null || health === undefined || health < 75) {
        atRiskExposure += accountWonRevenue;
      }
    }

    const currentPipelineRevenue = openValue * winRate;
    const currentExpectedRevenue = wonRevenue + currentPipelineRevenue;

    const projectedPipelineRevenue =
      openValue * projectedWinRate * (1 + (parameters.averageDealValueDelta || 0));
    const projectedRevenue =
      (wonRevenue + projectedPipelineRevenue) * (1 + (parameters.engagementIncrease || 0));
    const projectedRetentionRevenue =
      retentionRevenue + atRiskExposure * (parameters.churnReduction || 0);

    const baseTotal = currentExpectedRevenue + retentionRevenue;
    const projectedTotal = projectedRevenue + projectedRetentionRevenue;
    const revenueDelta = projectedTotal - baseTotal;

    const scenarioType = detectScenarioType(parameters);

    const result: ScenarioResult = {
      name: parameters.name || `${scenarioType} scenario`,
      scenarioType,
      parameters,
      projections: {
        currentExpectedRevenue: round(currentExpectedRevenue),
        projectedPipelineRevenue: round(projectedPipelineRevenue),
        projectedRetentionRevenue: round(projectedRetentionRevenue),
        projectedTotalRevenue: round(projectedTotal),
        revenueDelta: round(revenueDelta),
        projectedWinRate: round(projectedWinRate, 4),
      },
    };

    await this.prisma.eiScenario.create({
      data: {
        organizationId,
        name: result.name,
        scenarioType,
        parameters: parameters as unknown as object,
        projections: result.projections as unknown as object,
      },
    });

    this.messageBus.publish(
      EnterpriseIntelligenceEventType.SCENARIO_CREATED,
      new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.SCENARIO_CREATED, {
        organizationId,
        scenario: result,
      }),
    );

    return result;
  }
}

function detectScenarioType(parameters: ScenarioParameters): string {
  const active: string[] = [];
  if (parameters.winRateDelta) active.push("win_rate");
  if (parameters.averageDealValueDelta) active.push("deal_value");
  if (parameters.churnReduction) active.push("churn");
  if (parameters.engagementIncrease) active.push("engagement");
  if (active.length === 0) return "baseline";
  if (active.length === 1) return active[0];
  return "combined";
}

function validateParameters(parameters: ScenarioParameters): void {
  if (
    parameters.winRateDelta !== undefined &&
    (parameters.winRateDelta < -1 || parameters.winRateDelta > 1)
  ) {
    throw new Error("Invalid scenario parameter: winRateDelta must be between -1 and 1");
  }
  if (
    parameters.averageDealValueDelta !== undefined &&
    (parameters.averageDealValueDelta < -0.9 || parameters.averageDealValueDelta > 2)
  ) {
    throw new Error("Invalid scenario parameter: averageDealValueDelta must be between -0.9 and 2");
  }
  if (
    parameters.churnReduction !== undefined &&
    (parameters.churnReduction < 0 || parameters.churnReduction > 1)
  ) {
    throw new Error("Invalid scenario parameter: churnReduction must be between 0 and 1");
  }
  if (
    parameters.engagementIncrease !== undefined &&
    (parameters.engagementIncrease < 0 || parameters.engagementIncrease > 1)
  ) {
    throw new Error("Invalid scenario parameter: engagementIncrease must be between 0 and 1");
  }
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
