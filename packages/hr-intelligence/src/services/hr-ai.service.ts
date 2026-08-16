import { Inject, Injectable, Logger } from "@nestjs/common";
import type { AiModelProvider } from "@oracle69/sales-intelligence";
import { HrAiInsight, HrHealth } from "../types.js";

interface RawInsight {
  type?: string;
  title?: string;
  content?: string;
  priority?: string;
  impact?: string;
}

/**
 * Generates human resources intelligence insights (workforce analysis,
 * recruitment forecasts and actionable recommendations) from a tenant-scoped
 * {@link HrHealth} snapshot.
 *
 * The AI path runs through the existing `AiModelProvider` abstraction shared by
 * the sales, enterprise, marketing, operations and financial intelligence
 * packages. When no provider is configured or the model call fails, the service
 * falls back to deterministic insights computed from the HR KPIs.
 */
@Injectable()
export class HrAiService {
  private readonly logger = new Logger(HrAiService.name);

  constructor(@Inject("AiModelProvider") private readonly modelProvider?: AiModelProvider) {}

  async generateInsights(health: HrHealth): Promise<HrAiInsight[]> {
    if (
      !this.modelProvider ||
      !process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY === "your_api_key_here"
    ) {
      return this.deterministicInsights(health);
    }

    try {
      const instruction = `
        Analyze the workforce health snapshot of this organization from a CHRO perspective.
        Focus on headcount, turnover, open positions, candidate pipeline and actionable improvements.
        Return JSON only: an array of objects, each:
        { "type": "forecast|recommendation|alert", "title": "string", "content": "string", "priority": "low|normal|high", "impact": "string" }
      `;
      const response = await this.modelProvider.analyze(health, instruction);
      const parsed = JSON.parse(sanitizeJson(response.content));
      const insights = Array.isArray(parsed) ? parsed : parsed.insights;
      const normalized = normalizeInsights(insights);
      if (normalized.length === 0) {
        throw new Error("AI returned no usable insights");
      }
      return normalized;
    } catch (error) {
      this.logger.warn(
        `HR AI insight generation failed; using deterministic fallback: ${(error as Error).message}`,
      );
      return this.deterministicInsights(health);
    }
  }

  private deterministicInsights(health: HrHealth): HrAiInsight[] {
    const insights: HrAiInsight[] = [];
    const { kpis } = health;

    if (kpis.headcount === 0) {
      insights.push({
        type: "alert",
        title: "Empty Workforce",
        content:
          "No active employees are on record. Prioritize hiring to establish the operational workforce.",
        priority: "high",
        impact: "Operational Continuity",
      });
    } else if (kpis.turnoverRate > 0.25) {
      insights.push({
        type: "alert",
        title: "Elevated Turnover",
        content: `Turnover has reached ${(kpis.turnoverRate * 100).toFixed(0)}%. Review retention, compensation and career development to stabilize the workforce.`,
        priority: "high",
        impact: "Retention",
      });
    } else {
      insights.push({
        type: "forecast",
        title: "Workforce Stability",
        content: `With ${kpis.activeHeadcount} active employee(s) and a ${(kpis.turnoverRate * 100).toFixed(0)}% turnover rate, the workforce is positioned for sustained operations.`,
        priority: "normal",
        impact: "Operations",
      });
    }

    if (kpis.openPositions > 0) {
      if (kpis.candidatesInPipeline < kpis.openPositions) {
        insights.push({
          type: "alert",
          title: "Recruitment Pipeline Gap",
          content: `${kpis.openPositions} open position(s) are covered by only ${kpis.candidatesInPipeline} candidate(s) in the pipeline. Broaden sourcing to meet hiring demand.`,
          priority: "high",
          impact: "Hiring Velocity",
        });
      } else {
        insights.push({
          type: "recommendation",
          title: "Advance Pipeline Candidates",
          content: `${kpis.openPositions} open position(s) are backed by ${kpis.candidatesInPipeline} candidate(s). Accelerate screening and interviews to fill them.`,
          priority: "normal",
          impact: "Hiring Velocity",
        });
      }
    } else {
      insights.push({
        type: "recommendation",
        title: "Workforce Coverage",
        content:
          "All positions are filled. Plan headcount against upcoming business needs to avoid hiring lag.",
        priority: "low",
        impact: "Readiness",
      });
    }

    if (kpis.averageTimeToHireDays > 45) {
      insights.push({
        type: "recommendation",
        title: "Speed Up Hiring",
        content: `Average time to hire is ${kpis.averageTimeToHireDays} day(s). Streamline interview loops and offer approvals to reduce hiring latency.`,
        priority: "normal",
        impact: "Time-to-Hire",
      });
    } else {
      insights.push({
        type: "forecast",
        title: "Time-to-Hire",
        content:
          kpis.averageTimeToHireDays > 0
            ? `Average time to hire is ${kpis.averageTimeToHireDays} day(s), within the 45-day target.`
            : "No hires recorded yet; recruitment throughput cannot be measured.",
        priority: "low",
        impact: "Recruitment Efficiency",
      });
    }

    return insights;
  }
}

function sanitizeJson(content: string): string {
  return content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function normalizeInsights(raw: RawInsight[] | undefined): HrAiInsight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.content === "string" && item.content.trim().length > 0)
    .map((item) => ({
      type:
        item.type === "forecast" || item.type === "recommendation" || item.type === "alert"
          ? item.type
          : "recommendation",
      title:
        typeof item.title === "string" && item.title.length > 0 ? item.title : "HR recommendation",
      content: item.content as string,
      priority: item.priority === "low" || item.priority === "high" ? item.priority : "normal",
      impact:
        typeof item.impact === "string" && item.impact.length > 0
          ? item.impact
          : "Improved workforce health",
    }));
}
