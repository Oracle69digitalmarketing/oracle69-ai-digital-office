import { Injectable, Logger } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { MarketingIntelligenceEventType, MarketingIntelligenceEvent } from "../events/mi.events.js";
import { currentPeriod } from "../utils/period.js";

export interface SourceConversion {
  source: string;
  leads: number;
  conversions: number;
  conversionRate: number;
}

export interface ConversionMetrics {
  period: string;
  totalLeads: number;
  qualifiedLeads: number;
  conversions: number;
  conversionRate: number;
  bestSource: string | null;
  weakestSource: string | null;
  sources: SourceConversion[];
  funnel: {
    visitors: number;
    leads: number;
    mql: number;
    sql: number;
    converted: number;
  };
}

/**
 * Computes a deterministic CRO (conversion-rate optimisation) snapshot for the
 * organization. It analyses lead volume and conversion by source, identifies
 * the strongest and weakest converting sources and builds a funnel model from
 * lead scores under documented assumptions.
 */
@Injectable()
export class MiConversionEngine {
  private readonly logger = new Logger(MiConversionEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Deterministically computes the conversion metrics without side effects.
   */
  async compute(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<ConversionMetrics> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { crmLeads: true },
    });

    if (!organization) throw new Error("Organization not found");

    const leads = organization.crmLeads;
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(
      (lead) => lead.status === "qualified" || lead.status === "converted",
    ).length;
    const conversions = qualifiedLeads;
    const conversionRate = totalLeads > 0 ? conversions / totalLeads : 0;

    const bySource = new Map<string, SourceConversion>();
    for (const lead of leads) {
      const source =
        lead.source && lead.source.trim().length > 0 ? lead.source.toLowerCase() : "unknown";
      const entry = bySource.get(source) ?? { source, leads: 0, conversions: 0, conversionRate: 0 };
      entry.leads += 1;
      if (lead.status === "qualified" || lead.status === "converted") entry.conversions += 1;
      bySource.set(source, entry);
    }

    const sources = Array.from(bySource.values())
      .map((entry) => ({
        ...entry,
        conversionRate: round(entry.leads > 0 ? entry.conversions / entry.leads : 0, 4),
      }))
      .sort((a, b) => b.leads - a.leads);

    const withLeads = sources.filter((s) => s.leads > 0);
    const bestSource =
      withLeads.length > 0
        ? withLeads.reduce((best, s) => (s.conversionRate > best.conversionRate ? s : best)).source
        : null;
    const weakestSource =
      withLeads.length > 0
        ? withLeads.reduce((weakest, s) =>
            s.conversionRate < weakest.conversionRate ? s : weakest,
          ).source
        : null;

    const mql = leads.filter((lead) => (lead.score ?? 0) >= 60).length;
    const sql = leads.filter((lead) => (lead.score ?? 0) >= 75).length;
    const converted = leads.filter((lead) => lead.status === "converted").length;

    return {
      period,
      totalLeads,
      qualifiedLeads,
      conversions,
      conversionRate: round(conversionRate, 4),
      bestSource,
      weakestSource,
      sources,
      funnel: {
        visitors: Math.round(totalLeads * VISITS_PER_LEAD),
        leads: totalLeads,
        mql,
        sql,
        converted,
      },
    };
  }

  /**
   * Computes, persists and publishes the conversion snapshot.
   */
  async generateSnapshot(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<ConversionMetrics> {
    this.logger.log(
      `Generating conversion snapshot for organization ${organizationId}, period ${period}`,
    );

    const metrics = await this.compute(organizationId, period);

    await this.prisma.miConversionSnapshot.create({
      data: {
        organizationId,
        period,
        totalLeads: metrics.totalLeads,
        qualifiedLeads: metrics.qualifiedLeads,
        conversions: metrics.conversions,
        conversionRate: metrics.conversionRate,
        bestSource: metrics.bestSource,
        weakestSource: metrics.weakestSource,
        metrics: {
          funnel: metrics.funnel,
          sources: metrics.sources,
        } as object,
      },
    });

    this.messageBus.publish(
      MarketingIntelligenceEventType.CONVERSION_UPDATED,
      new MarketingIntelligenceEvent(MarketingIntelligenceEventType.CONVERSION_UPDATED, {
        organizationId,
        period,
        metrics,
      }),
    );

    return metrics;
  }

  /**
   * Lists the persisted conversion snapshots for the organization.
   */
  async listSnapshots(organizationId: string, take = 50) {
    return this.prisma.miConversionSnapshot.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

const VISITS_PER_LEAD = 100;

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
