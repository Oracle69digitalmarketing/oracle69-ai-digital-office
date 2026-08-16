import { Injectable, Logger } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { MarketingIntelligenceEventType, MarketingIntelligenceEvent } from "../events/mi.events.js";
import { currentPeriod } from "../utils/period.js";

export interface CampaignCreateInput {
  name: string;
  channel: string;
  objective?: string;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
}

export interface CampaignMetricResult {
  channel: string;
  leads: number;
  qualifiedLeads: number;
  conversions: number;
  conversionRate: number;
  revenueAttributed: number;
  spend: number;
  roas: number;
  cac: number;
  costPerLead: number;
}

export interface CampaignMetrics {
  period: string;
  channels: CampaignMetricResult[];
  totals: {
    leads: number;
    conversions: number;
    spend: number;
    revenueAttributed: number;
  };
}

const CANONICAL_CHANNELS = [
  "seo",
  "paid",
  "social",
  "email",
  "referral",
  "webinar",
  "event",
  "other",
];

const SOURCE_ALIASES: Record<string, string> = {
  organic: "seo",
  google: "seo",
  search: "seo",
  ads: "paid",
  "google-ads": "paid",
  paid: "paid",
  linkedin: "social",
  facebook: "social",
  instagram: "social",
  twitter: "social",
  x: "social",
  tiktok: "social",
  newsletter: "email",
  mail: "email",
  email: "email",
  "word-of-mouth": "referral",
  friend: "referral",
  conference: "event",
  trade_show: "event",
  webinar: "webinar",
  direct: "direct",
  other: "other",
};

/**
 * Manages marketing campaigns and computes per-channel growth metrics.
 *
 * Deterministically aggregates CRM leads (Sprint 8.1) by source and attributes
 * won opportunity revenue (Sprint 8.2) back to the channel through its
 * contacts, combining the result with campaign spend to produce lead volume,
 * conversion, ROAS, CAC and cost-per-lead figures.
 */
@Injectable()
export class MiCampaignEngine {
  private readonly logger = new Logger(MiCampaignEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Registers a new campaign for the organization, persisting it and publishing
   * a creation event. The organization must exist.
   */
  async createCampaign(organizationId: string, input: CampaignCreateInput) {
    this.logger.log(`Creating campaign '${input.name}' for organization ${organizationId}`);

    if (!input.name || input.name.trim().length === 0) {
      throw new Error("Invalid campaign: name is required");
    }
    if (!input.channel || input.channel.trim().length === 0) {
      throw new Error("Invalid campaign: channel is required");
    }
    const channel = normalizeChannel(input.channel);
    validateBudget(input.budget);
    validateBudget(input.spent);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) throw new Error("Organization not found");

    const campaign = await this.prisma.miCampaign.create({
      data: {
        organizationId,
        name: input.name.trim(),
        channel,
        objective: input.objective ?? null,
        budget: input.budget ?? null,
        spent: input.spent ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    });

    this.messageBus.publish(
      MarketingIntelligenceEventType.CAMPAIGN_CREATED,
      new MarketingIntelligenceEvent(MarketingIntelligenceEventType.CAMPAIGN_CREATED, {
        organizationId,
        campaign,
      }),
    );

    return campaign;
  }

  /**
   * Lists the persisted campaigns for the organization.
   */
  async listCampaigns(organizationId: string, take = 100) {
    return this.prisma.miCampaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  /**
   * Deterministically computes per-channel growth metrics without side effects.
   */
  async compute(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<CampaignMetrics> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        crmLeads: true,
        crmOpportunities: { include: { contacts: true } },
        miCampaigns: true,
      },
    });

    if (!organization) throw new Error("Organization not found");

    const leads = organization.crmLeads;
    const opportunities = organization.crmOpportunities;
    const campaigns = organization.miCampaigns;

    const channels = CANONICAL_CHANNELS.map((channel) =>
      this.computeChannel(channel, leads, opportunities, campaigns),
    );

    const totals = channels.reduce(
      (acc, channel) => ({
        leads: acc.leads + channel.leads,
        conversions: acc.conversions + channel.conversions,
        spend: round(acc.spend + channel.spend),
        revenueAttributed: round(acc.revenueAttributed + channel.revenueAttributed),
      }),
      { leads: 0, conversions: 0, spend: 0, revenueAttributed: 0 },
    );

    return { period, channels, totals };
  }

  private computeChannel(
    channel: string,
    leads: any[],
    opportunities: any[],
    campaigns: any[],
  ): CampaignMetricResult {
    const channelLeads = leads.filter((lead) => normalizeChannel(lead.source) === channel);
    const qualifiedLeads = channelLeads.filter(
      (lead) => lead.status === "qualified" || lead.status === "converted",
    ).length;
    const conversions = qualifiedLeads;

    const revenueAttributed = opportunities
      .filter(
        (o) =>
          o.stage === "won" && o.contacts.some((c: any) => normalizeChannel(c.source) === channel),
      )
      .reduce((sum, o) => sum + o.value, 0);

    const spend = campaigns
      .filter((c) => c.channel === channel)
      .reduce((sum, c) => sum + (c.spent ?? c.budget ?? 0), 0);

    const leadsGenerated = channelLeads.length;
    const conversionRate = leadsGenerated > 0 ? conversions / leadsGenerated : 0;
    const roas = spend > 0 ? revenueAttributed / spend : 0;
    const cac = conversions > 0 ? spend / conversions : 0;
    const costPerLead = leadsGenerated > 0 ? spend / leadsGenerated : 0;

    return {
      channel,
      leads: leadsGenerated,
      qualifiedLeads,
      conversions,
      conversionRate: round(conversionRate, 4),
      revenueAttributed: round(revenueAttributed),
      spend: round(spend),
      roas: round(roas, 2),
      cac: round(cac, 2),
      costPerLead: round(costPerLead, 2),
    };
  }

  /**
   * Computes, persists and publishes the campaign metrics snapshot for the period.
   */
  async generateMetrics(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<CampaignMetrics> {
    this.logger.log(
      `Generating campaign metrics for organization ${organizationId}, period ${period}`,
    );

    const metrics = await this.compute(organizationId, period);

    await this.prisma.miCampaignMetric.createMany({
      data: metrics.channels.map((channel) => ({
        organizationId,
        period,
        channel: channel.channel,
        leads: channel.leads,
        qualifiedLeads: channel.qualifiedLeads,
        conversions: channel.conversions,
        conversionRate: channel.conversionRate,
        revenueAttributed: channel.revenueAttributed,
        spend: channel.spend,
        roas: channel.roas,
        cac: channel.cac,
        costPerLead: channel.costPerLead,
        metrics: {
          totals: metrics.totals,
          sourceBreakdown: buildSourceBreakdown(channel.channel, metrics),
        } as object,
      })),
    });

    this.messageBus.publish(
      MarketingIntelligenceEventType.CAMPAIGN_METRICS_UPDATED,
      new MarketingIntelligenceEvent(MarketingIntelligenceEventType.CAMPAIGN_METRICS_UPDATED, {
        organizationId,
        period,
        metrics,
      }),
    );

    return metrics;
  }

  /**
   * Lists the persisted campaign metric snapshots for the organization.
   */
  async listMetrics(organizationId: string, take = 50) {
    return this.prisma.miCampaignMetric.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

function buildSourceBreakdown(channel: string, metrics: CampaignMetrics): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const entry of metrics.channels) {
    if (entry.channel !== channel) continue;
    breakdown.leads = entry.leads;
    breakdown.conversions = entry.conversions;
    breakdown.spend = entry.spend;
  }
  return breakdown;
}

function normalizeChannel(source: string | null | undefined): string {
  if (source === null || source === undefined) return "other";
  const normalized = String(source).toLowerCase().trim();
  if (normalized.length === 0) return "other";
  if (CANONICAL_CHANNELS.includes(normalized)) return normalized;
  return SOURCE_ALIASES[normalized] ?? "other";
}

function validateBudget(value: number | undefined): void {
  if (value !== undefined && (typeof value !== "number" || value < 0)) {
    throw new Error("Invalid campaign: budget and spent must be non-negative numbers");
  }
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
