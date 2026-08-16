import { Injectable, Logger } from "@nestjs/common";
import { MessageBus, MemoryManager } from "@oracle69/runtime";
import type { AiModelProvider } from "@oracle69/sales-intelligence";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import {
  EnterpriseIntelligenceEventType,
  EnterpriseIntelligenceEvent,
} from "../events/ei.events.js";
import { EiKpiEngine } from "./ei-kpi.engine.js";
import { EiBusinessHealthEngine } from "./ei-business-health.engine.js";
import { EiForecastEngine } from "./ei-forecast.engine.js";

export interface GeneratedInsight {
  type: string;
  content: string;
  confidence: number;
  source: "ai" | "deterministic";
}

export interface GeneratedRecommendation {
  title: string;
  priority: string;
  action: string;
  expectedImpact: string;
  source: "ai" | "deterministic";
}

export interface InsightGenerationResult {
  insights: GeneratedInsight[];
  recommendations: GeneratedRecommendation[];
  source: "ai" | "deterministic";
}

interface RawInsight {
  type?: string;
  content?: string;
  confidence?: number;
}

interface RawRecommendation {
  title?: string;
  priority?: string;
  action?: string;
  expectedImpact?: string;
}

/**
 * Generates executive insights and recommendations for an organization.
 *
 * The AI path runs through the existing `AiModelProvider` abstraction; whenever
 * the model call fails, returns malformed output or produces no content, the
 * engine falls back to deterministic insights computed from the persisted KPIs,
 * business health and forecast. Every insight is labelled with its source.
 */
@Injectable()
export class EiInsightEngine {
  private readonly logger = new Logger(EiInsightEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: AiModelProvider,
    private readonly kpiEngine: EiKpiEngine,
    private readonly healthEngine: EiBusinessHealthEngine,
    private readonly forecastEngine: EiForecastEngine,
    private readonly messageBus: MessageBus,
    private readonly memory: MemoryManager,
  ) {}

  async generateInsights(organizationId: string): Promise<InsightGenerationResult> {
    this.logger.log(
      `Generating enterprise intelligence insights for organization ${organizationId}`,
    );

    const kpis = await this.kpiEngine.compute(organizationId);
    const health = await this.healthEngine.compute(organizationId);
    const forecast = await this.forecastEngine.compute(organizationId);

    const context = { kpis, health, forecast };

    try {
      const aiResult = await this.runAiGeneration(context);
      await this.persistAndPublish(organizationId, aiResult);
      return aiResult;
    } catch (error) {
      this.logger.warn(
        `AI insight generation failed for organization ${organizationId}; using deterministic fallback: ${(error as Error).message}`,
      );
      const deterministic = this.buildDeterministicResult(health.status, kpis);
      await this.persistAndPublish(organizationId, deterministic);
      return deterministic;
    }
  }

  async listInsights(organizationId: string, take = 50) {
    return this.prisma.eiInsight.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async listRecommendations(organizationId: string, take = 50) {
    return this.prisma.eiRecommendation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  private async runAiGeneration(context: unknown): Promise<InsightGenerationResult> {
    const instruction = `
      Analyze the enterprise intelligence context for this organization from an executive perspective.
      Focus on revenue risks, customer health, pipeline coverage, and strategic opportunities.
      Return JSON only: {
        "insights": [ { "type": "kpi|health|forecast|sales|retention|executive", "content": "string", "confidence": 0.0-1.0 } ],
        "recommendations": [ { "title": "string", "priority": "low|normal|high|critical", "action": "string", "expectedImpact": "string" } ]
      }
    `;

    const response = await this.modelProvider.analyze(context, instruction);
    const parsed = JSON.parse(sanitizeJson(response.content));

    const insights = normalizeInsights(parsed.insights, "ai");
    const recommendations = normalizeRecommendations(parsed.recommendations, "ai");

    if (insights.length === 0 || recommendations.length === 0) {
      throw new Error("AI returned no insights or recommendations");
    }

    return { insights, recommendations, source: "ai" };
  }

  private buildDeterministicResult(
    healthStatus: BusinessHealthLike["status"],
    kpis: any,
  ): InsightGenerationResult {
    const insights: GeneratedInsight[] = [];
    const recommendations: GeneratedRecommendation[] = [];

    if (kpis.totalOpportunities > 0 && kpis.winRate < 0.4) {
      insights.push({
        type: "sales",
        content: `Win rate is ${(kpis.winRate * 100).toFixed(0)}% across ${kpis.totalOpportunities} opportunity/ies, below the 40% target.`,
        confidence: 0.7,
        source: "deterministic",
      });
    }

    if (kpis.averageCustomerHealth > 0 && kpis.averageCustomerHealth < 45) {
      insights.push({
        type: "health",
        content: `Average customer health is ${Math.round(kpis.averageCustomerHealth)}/100, which is critical.`,
        confidence: 0.8,
        source: "deterministic",
      });
    }

    if (kpis.accountsAtRisk > 0) {
      insights.push({
        type: "retention",
        content: `${kpis.accountsAtRisk} account(s) fall below healthy customer health.`,
        confidence: 0.75,
        source: "deterministic",
      });
    }

    if (kpis.openOpportunities === 0) {
      insights.push({
        type: "pipeline",
        content: "No open pipeline is currently recorded.",
        confidence: 0.6,
        source: "deterministic",
      });
    }

    if (kpis.totalInteractions === 0) {
      insights.push({
        type: "engagement",
        content: "No customer interactions have been recorded.",
        confidence: 0.7,
        source: "deterministic",
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: "executive",
        content: "Enterprise performance is on track with no material risks detected.",
        confidence: 0.6,
        source: "deterministic",
      });
    }

    if (healthStatus === "critical") {
      recommendations.push({
        title: "Launch retention intervention",
        priority: "critical",
        action: "Trigger a customer-success intervention mission for at-risk accounts.",
        expectedImpact: "Prevent avoidable churn and stabilise retained revenue.",
        source: "deterministic",
      });
    }

    if (kpis.totalOpportunities > 0 && kpis.winRate < 0.4) {
      recommendations.push({
        title: "Harden deal qualification",
        priority: "high",
        action: "Review pipeline quality and disqualify low-probability deals.",
        expectedImpact: "Raise the enterprise win rate toward 40%.",
        source: "deterministic",
      });
    }

    if (kpis.openOpportunities === 0) {
      recommendations.push({
        title: "Rebuild pipeline coverage",
        priority: "high",
        action: "Accelerate outbound lead generation and inbound conversion.",
        expectedImpact: "Restore open pipeline value.",
        source: "deterministic",
      });
    }

    if (kpis.accountsAtRisk > 0 && healthStatus !== "critical") {
      recommendations.push({
        title: "Proactive account outreach",
        priority: "normal",
        action: "Schedule health reviews with accounts below healthy customer health.",
        expectedImpact: "Improve customer health before churn materialises.",
        source: "deterministic",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: "Maintain operating cadence",
        priority: "normal",
        action: "Continue the current execution plan and revisit next quarter.",
        expectedImpact: "Sustain current enterprise performance.",
        source: "deterministic",
      });
    }

    return { insights, recommendations, source: "deterministic" };
  }

  private async persistAndPublish(
    organizationId: string,
    result: InsightGenerationResult,
  ): Promise<void> {
    await this.prisma.eiInsight.createMany({
      data: result.insights.map((insight) => ({
        organizationId,
        type: insight.type,
        content: insight.content,
        confidence: insight.confidence,
        source: insight.source,
      })),
    });

    await this.prisma.eiRecommendation.createMany({
      data: result.recommendations.map((recommendation) => ({
        organizationId,
        title: recommendation.title,
        priority: recommendation.priority,
        action: recommendation.action,
        expectedImpact: recommendation.expectedImpact,
        source: recommendation.source,
      })),
    });

    await this.memory.save({
      id: uuidv4(),
      type: "business",
      content:
        `Enterprise intelligence for ${organizationId}: ${result.insights.length} insight(s) and ` +
        `${result.recommendations.length} recommendation(s) generated via ${result.source}.`,
      timestamp: new Date().toISOString(),
      metadata: {
        organizationId,
        source: result.source,
        insightCount: result.insights.length,
        recommendationCount: result.recommendations.length,
      },
    });

    this.messageBus.publish(
      EnterpriseIntelligenceEventType.INSIGHT_GENERATED,
      new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.INSIGHT_GENERATED, {
        organizationId,
        insights: result.insights,
        source: result.source,
      }),
    );

    this.messageBus.publish(
      EnterpriseIntelligenceEventType.RECOMMENDATION_GENERATED,
      new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.RECOMMENDATION_GENERATED, {
        organizationId,
        recommendations: result.recommendations,
        source: result.source,
      }),
    );
  }
}

interface BusinessHealthLike {
  status: "healthy" | "at_risk" | "critical";
}

function sanitizeJson(content: string): string {
  return content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function normalizeInsights(
  raw: RawInsight[] | undefined,
  source: "ai" | "deterministic",
): GeneratedInsight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.content === "string" && item.content.trim().length > 0)
    .map((item) => {
      const confidence =
        typeof item.confidence === "number" && item.confidence >= 0 && item.confidence <= 1
          ? item.confidence
          : 0.5;
      return {
        type: typeof item.type === "string" && item.type.length > 0 ? item.type : "executive",
        content: item.content as string,
        confidence,
        source,
      };
    });
}

function normalizeRecommendations(
  raw: RawRecommendation[] | undefined,
  source: "ai" | "deterministic",
): GeneratedRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.action === "string" && item.action.trim().length > 0)
    .map((item) => {
      const priority = normalizePriority(item.priority);
      return {
        title:
          typeof item.title === "string" && item.title.length > 0
            ? item.title
            : "Recommended action",
        priority,
        action: item.action as string,
        expectedImpact:
          typeof item.expectedImpact === "string" && item.expectedImpact.length > 0
            ? item.expectedImpact
            : "Improved enterprise performance",
        source,
      };
    });
}

function normalizePriority(priority: unknown): string {
  if (priority === "low" || priority === "high" || priority === "critical") return priority;
  return "normal";
}
