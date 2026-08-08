import { Injectable, Logger } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { CustomerSuccessEventType, CustomerSuccessEvent } from '../events/cs.events.js';

export interface HealthScoreResult {
  score: number;
  status: 'healthy' | 'at_risk' | 'critical';
  reasoning: string;
  factors: string[];
}

@Injectable()
export class CsHealthEngine {
  private readonly logger = new Logger(CsHealthEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly messageBus: MessageBus
  ) {}

  async calculateHealth(crmOrganizationId: string): Promise<HealthScoreResult> {
    this.logger.log(`Calculating health for organization: ${crmOrganizationId}`);

    const organization = await this.prisma.crmOrganization.findUnique({
      where: { id: crmOrganizationId },
      include: {
        contacts: { orderBy: { createdAt: 'desc' } },
        opportunities: { orderBy: { updatedAt: 'desc' }, take: 100 },
        interactions: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
    });

    if (!organization) throw new Error('Organization not found');

    const wonOpportunities = organization.opportunities.filter((o) => o.stage === 'won');
    const lostOpportunities = organization.opportunities.filter((o) => o.stage === 'lost');
    const openOpportunities = organization.opportunities.filter(
      (o) => o.stage !== 'won' && o.stage !== 'lost'
    );
    const interactionCount = organization.interactions.length;
    const contactCount = organization.contacts.length;

    let score = 50;
    const positive: string[] = [];
    const negative: string[] = [];

    // Positive: closed-won revenue history
    if (wonOpportunities.length > 0) {
      score += Math.min(20, wonOpportunities.length * 5);
      positive.push(`${wonOpportunities.length} won opportunity/ies`);
    }

    // Positive: engagement through recorded interactions
    if (interactionCount >= 5) {
      score += Math.min(20, interactionCount * 2);
      positive.push(`${interactionCount} recorded interactions`);
    }

    // Positive: active contact base
    if (contactCount > 0) {
      score += 5;
      positive.push(`${contactCount} active contact(s)`);
    }

    // Positive: open pipeline
    if (openOpportunities.length > 0) {
      score += 5;
      positive.push(`${openOpportunities.length} open opportunity/ies`);
    }

    // Negative: no engagement
    if (interactionCount === 0) {
      score -= 15;
      negative.push('No recorded interactions');
    } else if (interactionCount < 3) {
      score -= 10;
      negative.push('Low recent interaction volume');
    }

    // Negative: pipeline fully closed without wins
    if (organization.opportunities.length > 0 && wonOpportunities.length === 0 && openOpportunities.length === 0) {
      score -= 15;
      negative.push('All opportunities closed without wins');
    }

    // Negative: unusually high loss concentration
    if (
      organization.opportunities.length >= 2 &&
      lostOpportunities.length / organization.opportunities.length >= 0.5
    ) {
      score -= 10;
      negative.push(`${lostOpportunities.length} lost opportunity/ies`);
    }

    score = Math.max(0, Math.min(100, score));

    const status: HealthScoreResult['status'] =
      score >= 75 ? 'healthy' : (score >= 45 ? 'at_risk' : 'critical');

    const reasoning =
      `Based on opportunity outcomes, interaction volume, contact base and pipeline activity, ` +
      `health is ${status} (score ${score}/100).`;

    const result: HealthScoreResult = {
      score,
      status,
      reasoning,
      factors: [...positive, ...negative],
    };

    // Compare against the previous score to detect deterioration
    const previousScore = await this.prisma.csHealthScore.findFirst({
      where: { crmOrganizationId },
      orderBy: { createdAt: 'desc' },
    });

    // Persistence
    await this.prisma.csHealthScore.create({
      data: {
        crmOrganizationId,
        score: result.score,
        reasoning: result.reasoning,
      },
    });

    await this.prisma.crmOrganization.update({
      where: { id: crmOrganizationId },
      data: { healthScore: result.score, lastHealthUpdate: new Date() }
    });

    // Events
    this.messageBus.publish(
      CustomerSuccessEventType.HEALTH_UPDATED,
      new CustomerSuccessEvent(CustomerSuccessEventType.HEALTH_UPDATED, { crmOrganizationId, ...result })
    );

    const deteriorated =
      status === 'critical' || (previousScore !== null && result.score < previousScore.score);

    if (deteriorated) {
      this.messageBus.publish(
        CustomerSuccessEventType.HEALTH_DETERIORATED,
        new CustomerSuccessEvent(CustomerSuccessEventType.HEALTH_DETERIORATED, {
          crmOrganizationId,
          ...result,
          previousScore: previousScore?.score ?? null,
        })
      );
    }

    return result;
  }
}
