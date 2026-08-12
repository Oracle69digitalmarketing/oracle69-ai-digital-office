import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, MissionManager, MissionStatus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { MarketingIntelligenceEventType, MarketingIntelligenceEvent } from '../events/mi.events.js';
import { MiCampaignEngine } from './mi-campaign.engine.js';
import { MiSeoEngine } from './mi-seo.engine.js';
import { MiConversionEngine } from './mi-conversion.engine.js';
import { currentPeriod } from '../utils/period.js';

/**
 * Composes the marketing intelligence engines into a growth report, persists
 * it, publishes an event and escalates a strategic mission through the existing
 * MissionManager whenever the growth score falls into critical territory —
 * Growth Intelligence does not only report, it acts.
 */
@Injectable()
export class MiReportService {
  private readonly logger = new Logger(MiReportService.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly campaignEngine: MiCampaignEngine,
    private readonly seoEngine: MiSeoEngine,
    private readonly conversionEngine: MiConversionEngine,
    private readonly missionManager: MissionManager,
    private readonly messageBus: MessageBus
  ) {}

  async generateReport(organizationId: string, period: string = currentPeriod()) {
    this.logger.log(`Generating growth report for organization ${organizationId}, period ${period}`);

    const campaign = await this.campaignEngine.compute(organizationId, period);
    const seo = await this.seoEngine.compute(organizationId, period);
    const conversion = await this.conversionEngine.compute(organizationId, period);

    const growthScore = computeGrowthScore(campaign, conversion);

    const summary = {
      period,
      growthScore,
      campaign,
      seo,
      conversion,
    };

    const report = await this.prisma.miGrowthReport.create({
      data: {
        organizationId,
        period,
        growthScore,
        summary: summary as unknown as object,
      },
    });

    this.messageBus.publish(
      MarketingIntelligenceEventType.REPORT_GENERATED,
      new MarketingIntelligenceEvent(MarketingIntelligenceEventType.REPORT_GENERATED, {
        organizationId,
        reportId: report.id,
        period,
        growthScore,
      })
    );

    if (growthScore < GROWTH_ALERT_THRESHOLD) {
      const missionId = uuidv4();
      await this.missionManager.createMission({
        id: missionId,
        goal:
          `Growth intelligence: the growth score is ${Math.round(growthScore)}/100 (below ${GROWTH_ALERT_THRESHOLD}) for ` +
          `organization ${organizationId}. Execute the growth recovery plan.`,
        priority: 'critical',
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        owner: 'marketing-intelligence',
        status: MissionStatus.DRAFT,
        tenantId: organizationId,
      });

      this.messageBus.publish(
        MarketingIntelligenceEventType.GROWTH_ALERT_REQUIRED,
        new MarketingIntelligenceEvent(MarketingIntelligenceEventType.GROWTH_ALERT_REQUIRED, {
          organizationId,
          missionId,
          growthScore,
        })
      );
    }

    return { id: report.id, period, summary };
  }

  async listReports(organizationId: string, take = 20) {
    return this.prisma.miGrowthReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}

const GROWTH_ALERT_THRESHOLD = 45;

function computeGrowthScore(campaign: any, conversion: any): number {
  let score = 50;
  const roasChannels = campaign.channels.filter((c: any) => c.spend > 0);
  const worstRoas = roasChannels.length > 0 ? Math.min(...roasChannels.map((c: any) => c.roas)) : 0;
  const maxRoas = roasChannels.length > 0 ? Math.max(...roasChannels.map((c: any) => c.roas)) : 0;

  score += Math.min(20, conversion.conversions * 5);
  if (conversion.totalLeads > 0) {
    score += Math.min(30, conversion.conversionRate * 40);
  }
  if (maxRoas > 0) {
    score += Math.min(15, maxRoas * 5);
  }
  if (campaign.channels.some((c: any) => c.leads > 0)) {
    const organic = campaign.channels.find((c: any) => c.channel === 'seo');
    if (organic && organic.leads > 0) {
      score += Math.min(15, (organic.leads / campaign.totals.leads) * 20);
    }
  }

  if (campaign.totals.leads === 0) {
    score -= 15;
  }
  if (roasChannels.length > 0 && worstRoas < 1) {
    score -= 10;
  }
  if (conversion.conversions === 0 && conversion.totalLeads > 0) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
