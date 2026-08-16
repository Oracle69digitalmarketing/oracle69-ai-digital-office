import { Injectable, Logger } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { MarketingIntelligenceEventType, MarketingIntelligenceEvent } from "../events/mi.events.js";
import { currentPeriod } from "../utils/period.js";

export interface SeoMetrics {
  period: string;
  organicLeads: number;
  organicShare: number;
  avgPosition: number;
  keywordsTracked: number;
  metrics: {
    organicVisits: number;
    previousAvgPosition: number | null;
    rankingsDistribution: { band: string; count: number }[];
  };
}

const BASELINE_AVG_POSITION = 12;

/**
 * Computes a deterministic SEO health snapshot for the organization.
 *
 * With no live search-console feed wired yet, the engine derives organic
 * performance from CRM lead sources (organic/SEO leads), tracks the trend
 * against the previous snapshot and estimates organic visits and keyword
 * rankings under documented assumptions.
 */
@Injectable()
export class MiSeoEngine {
  private readonly logger = new Logger(MiSeoEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Deterministically computes the SEO metrics without side effects.
   */
  async compute(organizationId: string, period: string = currentPeriod()): Promise<SeoMetrics> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { crmLeads: true },
    });

    if (!organization) throw new Error("Organization not found");

    const leads = organization.crmLeads;
    const organicLeads = leads.filter(
      (lead) => lead.source === "seo" || lead.source === "organic",
    ).length;
    const totalLeads = leads.length;
    const organicShare = totalLeads > 0 ? organicLeads / totalLeads : 0;

    const previous = await this.prisma.miSeoSnapshot.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    const previousOrganicLeads =
      previous !== null && typeof (previous.metrics as any)?.organicVisits === "number"
        ? Math.round((previous.metrics as any).organicVisits / ORGANIC_VISITS_PER_LEAD)
        : 0;

    const trend = organicLeads - previousOrganicLeads;
    let avgPosition = BASELINE_AVG_POSITION;
    if (previous !== null) {
      avgPosition = Math.max(1, previous.avgPosition - Math.sign(trend) * 0.5);
    }

    const keywordsTracked = 10 + organicLeads;
    const rankingsDistribution = [
      { band: "1-3", count: Math.round(keywordsTracked * 0.05) },
      { band: "4-10", count: Math.round(keywordsTracked * 0.15) },
      { band: "11-20", count: Math.round(keywordsTracked * 0.3) },
      { band: "21-50", count: Math.round(keywordsTracked * 0.35) },
      { band: "51+", count: Math.max(0, keywordsTracked - Math.round(keywordsTracked * 0.85)) },
    ];

    return {
      period,
      organicLeads,
      organicShare: round(organicShare, 4),
      avgPosition: round(avgPosition, 2),
      keywordsTracked,
      metrics: {
        organicVisits: Math.round(organicLeads * ORGANIC_VISITS_PER_LEAD),
        previousAvgPosition: previous?.avgPosition ?? null,
        rankingsDistribution,
      },
    };
  }

  /**
   * Computes, persists and publishes the SEO snapshot.
   */
  async generateSnapshot(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<SeoMetrics> {
    this.logger.log(`Generating SEO snapshot for organization ${organizationId}, period ${period}`);

    const metrics = await this.compute(organizationId, period);

    await this.prisma.miSeoSnapshot.create({
      data: {
        organizationId,
        period,
        organicLeads: metrics.organicLeads,
        organicShare: metrics.organicShare,
        avgPosition: metrics.avgPosition,
        keywordsTracked: metrics.keywordsTracked,
        metrics: metrics.metrics as unknown as object,
      },
    });

    this.messageBus.publish(
      MarketingIntelligenceEventType.SEO_UPDATED,
      new MarketingIntelligenceEvent(MarketingIntelligenceEventType.SEO_UPDATED, {
        organizationId,
        period,
        metrics,
      }),
    );

    return metrics;
  }

  /**
   * Lists the persisted SEO snapshots for the organization.
   */
  async listSnapshots(organizationId: string, take = 50) {
    return this.prisma.miSeoSnapshot.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

const ORGANIC_VISITS_PER_LEAD = 120;

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
