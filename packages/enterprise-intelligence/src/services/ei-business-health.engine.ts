import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { EnterpriseIntelligenceEventType, EnterpriseIntelligenceEvent } from '../events/ei.events.js';

export interface BusinessHealthResult {
  score: number;
  status: 'healthy' | 'at_risk' | 'critical';
  reasoning: string;
  factors: string[];
}

/**
 * Computes a unified, enterprise-wide business health score by blending sales
 * pipeline outcomes with the customer health (Sprint 8.3) and churn signals.
 */
@Injectable()
export class EiBusinessHealthEngine {
  private readonly logger = new Logger(EiBusinessHealthEngine.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly messageBus: MessageBus,
    @Optional() @Inject('PrismaService') prismaService?: PrismaClient,
  ) {
    this.prisma = prismaService ?? new PrismaClient();
  }

  /**
   * Deterministically computes the business health result without side effects.
   */
  async compute(organizationId: string): Promise<BusinessHealthResult> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        crmOpportunities: true,
        crmContacts: true,
        crmOrganizations: {
          include: {
            churnRisks: true,
            interactions: true,
          },
        },
      },
    });

    if (!organization) throw new Error('Organization not found');

    const opportunities = organization.crmOpportunities;
    const accounts = organization.crmOrganizations;

    const wonOpportunities = opportunities.filter((o) => o.stage === 'won');
    const lostOpportunities = opportunities.filter((o) => o.stage === 'lost');
    const openOpportunities = opportunities.filter((o) => o.stage !== 'won' && o.stage !== 'lost');

    const healthScores = accounts
      .map((a) => a.healthScore)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageCustomerHealth =
      healthScores.length > 0
        ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
        : 0;

    const accountsAtRisk = accounts.filter((a) => a.healthScore !== null && a.healthScore !== undefined && a.healthScore < 75).length;
    const activeChurnRisks = accounts.reduce(
      (sum, a) => sum + a.churnRisks.filter((r) => r.severity === 'high' || r.severity === 'critical').length,
      0
    );
    const totalInteractions = accounts.reduce((sum, a) => sum + a.interactions.length, 0);

    let score = 50;
    const positive: string[] = [];
    const negative: string[] = [];

    if (healthScores.length > 0) {
      score += Math.min(20, averageCustomerHealth / 5);
      positive.push(`Average customer health ${Math.round(averageCustomerHealth)}/100 across ${healthScores.length} account(s)`);
    }

    if (wonOpportunities.length > 0) {
      score += 10;
      positive.push(`${wonOpportunities.length} won opportunity/ies`);
    }

    if (openOpportunities.length > 0) {
      score += 5;
      positive.push(`${openOpportunities.length} open opportunity/ies`);
    }

    if (organization.crmContacts.length > 0) {
      score += 5;
      positive.push(`${organization.crmContacts.length} active contact(s)`);
    }

    if (accountsAtRisk > 0) {
      const penalty = Math.min(15, accountsAtRisk * 5);
      score -= penalty;
      negative.push(`${accountsAtRisk} account(s) below healthy customer health`);
    }

    if (activeChurnRisks > 0) {
      score -= 10;
      negative.push(`${activeChurnRisks} active churn/retention risk(s)`);
    }

    if (totalInteractions === 0) {
      score -= 10;
      negative.push('No recorded customer interactions');
    }

    if (opportunities.length > 0 && wonOpportunities.length === 0 && openOpportunities.length === 0) {
      score -= 10;
      negative.push('All opportunities closed without wins');
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const status: BusinessHealthResult['status'] =
      score >= 75 ? 'healthy' : (score >= 45 ? 'at_risk' : 'critical');

    const reasoning =
      `Business health is ${status} (score ${score}/100) based on customer health, ` +
      `pipeline outcomes, churn signals and engagement across the enterprise.`;

    return {
      score,
      status,
      reasoning,
      factors: [...positive, ...negative],
    };
  }

  /**
   * Computes, persists and publishes the business health snapshot, emitting a
   * deterioration event when health is critical or drops versus the previous snapshot.
   */
  async generateSnapshot(organizationId: string): Promise<BusinessHealthResult> {
    this.logger.log(`Generating enterprise business health snapshot for organization ${organizationId}`);

    const result = await this.compute(organizationId);

    const previous = await this.prisma.eiBusinessHealthSnapshot.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.eiBusinessHealthSnapshot.create({
      data: {
        organizationId,
        score: result.score,
        status: result.status,
        reasoning: result.reasoning,
        factors: result.factors,
      },
    });

    this.messageBus.publish(
      EnterpriseIntelligenceEventType.BUSINESS_HEALTH_UPDATED,
      new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.BUSINESS_HEALTH_UPDATED, {
        organizationId,
        ...result,
      })
    );

    const deteriorated =
      result.status === 'critical' || (previous !== null && result.score < previous.score);

    if (deteriorated) {
      this.messageBus.publish(
        EnterpriseIntelligenceEventType.BUSINESS_HEALTH_DETERIORATED,
        new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.BUSINESS_HEALTH_DETERIORATED, {
          organizationId,
          ...result,
          previousScore: previous?.score ?? null,
        })
      );
    }

    return result;
  }
}
