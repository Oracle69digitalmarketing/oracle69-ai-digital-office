import { Injectable, Logger } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { MarketingIntelligenceEventType, MarketingIntelligenceEvent } from "../events/mi.events.js";

export type LeadGrade = "A" | "B" | "C" | "D";
export type LeadStage = "sql" | "mql" | "nurture" | "disqualified" | "converted";

export interface LeadScoreResult {
  leadId: string;
  leadTitle: string | null;
  channel: string | null;
  score: number;
  grade: LeadGrade;
  status: LeadStage;
  reasoning: string[];
}

export interface DetectedOpportunity {
  leadId: string;
  leadTitle: string | null;
  score: number;
  channel: string | null;
}

export interface LeadScoringSummary {
  scored: number;
  sql: number;
  mql: number;
  nurture: number;
  disqualified: number;
  converted: number;
  opportunities: number;
}

const SQL_THRESHOLD = 75;
const MQL_THRESHOLD = 60;
const NURTURE_THRESHOLD = 40;

const SOURCE_QUALITY: Record<string, number> = {
  referral: 20,
  webinar: 15,
  paid: 15,
  event: 12,
  seo: 10,
  organic: 10,
  social: 10,
  email: 10,
  direct: 5,
  other: 5,
};

/**
 * Scores every lead of the organization and detects sales-ready opportunities.
 *
 * Deterministic scoring combines lead source quality with linked-account
 * revenue and health, engagement (activities, notes) and CRM status. Leads that
 * score at or above the SQL threshold are surfaced as opportunities — "Growth
 * Intelligence does not only report, it acts."
 */
@Injectable()
export class MiLeadScoreEngine {
  private readonly logger = new Logger(MiLeadScoreEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Scores all leads, persists the results, updates CRM lead scores and detects
   * sales-ready opportunities.
   */
  async generate(organizationId: string): Promise<{
    summary: LeadScoringSummary;
    opportunities: DetectedOpportunity[];
    results: LeadScoreResult[];
  }> {
    this.logger.log(`Scoring leads for organization ${organizationId}`);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        crmLeads: { include: { crmOrganization: true, activities: true, notes: true } },
      },
    });

    if (!organization) throw new Error("Organization not found");

    const results: LeadScoreResult[] = [];
    const opportunities: DetectedOpportunity[] = [];

    for (const lead of organization.crmLeads) {
      const result = scoreLead(lead);
      results.push(result);

      await this.prisma.crmLead.update({
        where: { id: lead.id },
        data: { score: result.score },
      });

      if (
        result.status === "sql" &&
        lead.status !== "converted" &&
        lead.status !== "disqualified"
      ) {
        opportunities.push({
          leadId: lead.id,
          leadTitle: lead.title ?? null,
          score: result.score,
          channel: result.channel,
        });
      }
    }

    await this.prisma.miLeadScore.createMany({
      data: results.map((result) => ({
        organizationId,
        leadId: result.leadId,
        leadTitle: result.leadTitle,
        score: result.score,
        grade: result.grade,
        status: result.status,
        channel: result.channel,
        reasoning: result.reasoning,
      })),
    });

    const summary = summarize(results, opportunities.length);

    this.messageBus.publish(
      MarketingIntelligenceEventType.LEAD_SCORED,
      new MarketingIntelligenceEvent(MarketingIntelligenceEventType.LEAD_SCORED, {
        organizationId,
        summary,
      }),
    );

    if (opportunities.length > 0) {
      this.messageBus.publish(
        MarketingIntelligenceEventType.OPPORTUNITY_DETECTED,
        new MarketingIntelligenceEvent(MarketingIntelligenceEventType.OPPORTUNITY_DETECTED, {
          organizationId,
          opportunities,
        }),
      );
    }

    return { summary, opportunities, results };
  }

  /**
   * Lists the persisted lead scores for the organization.
   */
  async listScores(organizationId: string, take = 100) {
    return this.prisma.miLeadScore.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

function scoreLead(lead: any): LeadScoreResult {
  const reasoning: string[] = [];
  let score = 0;

  const channel = lead.source && lead.source.trim().length > 0 ? lead.source.toLowerCase() : null;
  const sourcePoints = channel !== null ? (SOURCE_QUALITY[channel] ?? 5) : 0;
  score += sourcePoints;
  if (channel !== null) reasoning.push(`Source '${channel}' contributes ${sourcePoints} points`);

  const account = lead.crmOrganization;
  if (account) {
    if (typeof account.revenue === "number") {
      if (account.revenue > 1000000) {
        score += 15;
        reasoning.push("Linked account revenue exceeds $1M");
      } else if (account.revenue >= 500000) {
        score += 10;
        reasoning.push("Linked account revenue is between $500K and $1M");
      } else {
        score += 5;
        reasoning.push("Linked account revenue is under $500K");
      }
    }
    if (typeof account.healthScore === "number") {
      if (account.healthScore >= 75) {
        score += 10;
        reasoning.push("Linked account is healthy");
      } else if (account.healthScore >= 45) {
        score += 5;
        reasoning.push("Linked account is at risk");
      } else {
        score -= 10;
        reasoning.push("Linked account is critical");
      }
    }
  }

  const activityPoints = Math.min(10, lead.activities.length * 2);
  if (activityPoints > 0) {
    score += activityPoints;
    reasoning.push(`Engagement contributes ${activityPoints} points`);
  }

  if (lead.notes.length > 0) {
    score += 5;
    reasoning.push("Lead has recorded notes");
  }

  const status = lead.status ?? "new";
  if (status === "converted") {
    score += 30;
    reasoning.push("Lead is already converted");
  } else if (status === "qualified") {
    score += 20;
    reasoning.push("Lead is already qualified");
  } else if (status === "nurture") {
    score += 5;
  } else if (status === "disqualified") {
    score -= 30;
    reasoning.push("Lead was previously disqualified");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let stage: LeadStage;
  if (status === "converted") {
    stage = "converted";
  } else if (score >= SQL_THRESHOLD) {
    stage = "sql";
  } else if (score >= MQL_THRESHOLD) {
    stage = "mql";
  } else if (score >= NURTURE_THRESHOLD) {
    stage = "nurture";
  } else {
    stage = "disqualified";
  }

  return {
    leadId: lead.id,
    leadTitle: lead.title ?? null,
    channel,
    score,
    grade: toGrade(score),
    status: stage,
    reasoning,
  };
}

function toGrade(score: number): LeadGrade {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

function summarize(results: LeadScoreResult[], opportunities: number): LeadScoringSummary {
  const summary: LeadScoringSummary = {
    scored: results.length,
    sql: 0,
    mql: 0,
    nurture: 0,
    disqualified: 0,
    converted: 0,
    opportunities,
  };
  for (const result of results) {
    summary[result.status] += 1;
  }
  return summary;
}
