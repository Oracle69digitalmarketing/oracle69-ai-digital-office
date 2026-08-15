import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { EnterpriseIntelligenceEventType, EnterpriseIntelligenceEvent } from '../events/ei.events.js';
import { currentPeriod } from '../utils/period.js';

export interface EnterpriseKpiMetrics {
  period: string;
  totalPipelineValue: number;
  weightedPipeline: number;
  openPipelineValue: number;
  wonRevenue: number;
  lostValue: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  totalOpportunities: number;
  winRate: number;
  totalLeads: number;
  qualifiedLeads: number;
  leadConversionRate: number;
  totalContacts: number;
  activeAccounts: number;
  accountsWithHealthScore: number;
  averageCustomerHealth: number;
  accountsAtRisk: number;
  criticalAccounts: number;
  activeChurnRisks: number;
  totalInteractions: number;
}

/**
 * Computes enterprise-wide KPI metrics by aggregating CRM (Sprint 8.1),
 * Sales Intelligence (Sprint 8.2) and Customer Success (Sprint 8.3) data.
 */
@Injectable()
export class EiKpiEngine {
  private readonly logger = new Logger(EiKpiEngine.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly messageBus: MessageBus,
    @Optional() @Inject('PrismaService') prismaService?: PrismaClient,
  ) {
    this.prisma = prismaService ?? new PrismaClient();
  }

  /**
   * Deterministically computes enterprise KPIs without side effects.
   */
  async compute(organizationId: string, period: string = currentPeriod()): Promise<EnterpriseKpiMetrics> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        crmOpportunities: true,
        crmLeads: true,
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
    const leads = organization.crmLeads;
    const contacts = organization.crmContacts;
    const accounts = organization.crmOrganizations;

    const openOpportunities = opportunities.filter((o) => o.stage !== 'won' && o.stage !== 'lost');
    const wonOpportunities = opportunities.filter((o) => o.stage === 'won');
    const lostOpportunities = opportunities.filter((o) => o.stage === 'lost');

    const totalPipelineValue = openOpportunities.reduce((sum, o) => sum + o.value, 0);
    const weightedPipeline = openOpportunities.reduce(
      (sum, o) => sum + o.value * (o.probability || 0.5),
      0
    );
    const wonRevenue = wonOpportunities.reduce((sum, o) => sum + o.value, 0);
    const lostValue = lostOpportunities.reduce((sum, o) => sum + o.value, 0);

    const wonLostTotal = wonOpportunities.length + lostOpportunities.length;
    const winRate = wonLostTotal > 0 ? wonOpportunities.length / wonLostTotal : 0;

    const qualifiedLeads = leads.filter((l) => l.status === 'converted' || l.status === 'qualified').length;
    const leadConversionRate = leads.length > 0 ? qualifiedLeads / leads.length : 0;

    const healthScores = accounts
      .map((a) => a.healthScore)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageCustomerHealth =
      healthScores.length > 0
        ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
        : 0;

    const accountsAtRisk = accounts.filter((a) => a.healthScore !== null && a.healthScore !== undefined && a.healthScore < 75).length;
    const criticalAccounts = accounts.filter((a) => a.healthScore !== null && a.healthScore !== undefined && a.healthScore < 45).length;
    const activeChurnRisks = accounts.reduce(
      (sum, a) => sum + a.churnRisks.filter((r) => r.severity === 'high' || r.severity === 'critical').length,
      0
    );
    const totalInteractions = accounts.reduce((sum, a) => sum + a.interactions.length, 0);

    return {
      period,
      totalPipelineValue: round(totalPipelineValue),
      weightedPipeline: round(weightedPipeline),
      openPipelineValue: round(totalPipelineValue),
      wonRevenue: round(wonRevenue),
      lostValue: round(lostValue),
      openOpportunities: openOpportunities.length,
      wonOpportunities: wonOpportunities.length,
      lostOpportunities: lostOpportunities.length,
      totalOpportunities: opportunities.length,
      winRate: round(winRate, 4),
      totalLeads: leads.length,
      qualifiedLeads,
      leadConversionRate: round(leadConversionRate, 4),
      totalContacts: contacts.length,
      activeAccounts: accounts.length,
      accountsWithHealthScore: healthScores.length,
      averageCustomerHealth: round(averageCustomerHealth),
      accountsAtRisk,
      criticalAccounts,
      activeChurnRisks,
      totalInteractions,
    };
  }

  /**
   * Computes, persists and publishes an enterprise KPI snapshot.
   */
  async generateSnapshot(organizationId: string, period: string = currentPeriod()): Promise<EnterpriseKpiMetrics> {
    this.logger.log(`Generating enterprise KPI snapshot for organization ${organizationId}, period ${period}`);

    const metrics = await this.compute(organizationId, period);

    await this.prisma.eiKpiSnapshot.create({
      data: {
        organizationId,
        period,
        metrics: metrics as unknown as object,
      },
    });

    this.messageBus.publish(
      EnterpriseIntelligenceEventType.KPI_UPDATED,
      new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.KPI_UPDATED, { organizationId, metrics })
    );

    return metrics;
  }
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
