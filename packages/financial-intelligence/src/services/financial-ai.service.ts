import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AiModelProvider } from '@oracle69/sales-intelligence';
import { FinancialAiInsight, FinancialHealth } from '../types.js';

interface RawInsight {
  type?: string;
  title?: string;
  content?: string;
  priority?: string;
  impact?: string;
}

/**
 * Generates financial intelligence insights (health analysis, forecasts and
 * actionable recommendations) from a tenant-scoped {@link FinancialHealth}
 * snapshot.
 *
 * The AI path runs through the existing `AiModelProvider` abstraction shared by
 * the sales, enterprise, marketing and operations intelligence packages. When
 * no provider is configured or the model call fails, the service falls back to
 * deterministic insights computed from the financial KPIs.
 */
@Injectable()
export class FinancialAiService {
  private readonly logger = new Logger(FinancialAiService.name);

  constructor(@Inject('AiModelProvider') private readonly modelProvider?: AiModelProvider) {}

  async generateInsights(health: FinancialHealth): Promise<FinancialAiInsight[]> {
    if (!this.modelProvider || !process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY === 'your_api_key_here') {
      return this.deterministicInsights(health);
    }

    try {
      const instruction = `
        Analyze the financial health snapshot of this organization from a CFO perspective.
        Focus on profitability, budget utilization, cash runway, receivables and actionable improvements.
        Return JSON only: an array of objects, each:
        { "type": "forecast|recommendation|alert", "title": "string", "content": "string", "priority": "low|normal|high", "impact": "string" }
      `;
      const response = await this.modelProvider.analyze(health, instruction);
      const parsed = JSON.parse(sanitizeJson(response.content));
      const insights = Array.isArray(parsed) ? parsed : parsed.insights;
      const normalized = normalizeInsights(insights);
      if (normalized.length === 0) {
        throw new Error('AI returned no usable insights');
      }
      return normalized;
    } catch (error) {
      this.logger.warn(`Financial AI insight generation failed; using deterministic fallback: ${(error as Error).message}`);
      return this.deterministicInsights(health);
    }
  }

  private deterministicInsights(health: FinancialHealth): FinancialAiInsight[] {
    const insights: FinancialAiInsight[] = [];
    const { kpis } = health;

    if (kpis.netProfit < 0) {
      insights.push({
        type: 'alert',
        title: 'Negative Profitability',
        content: `Expenses exceed revenue by $${Math.abs(kpis.netProfit).toFixed(2)}. Review departmental budgets to identify optimization opportunities.`,
        priority: 'high',
        impact: 'Sustainability',
      });
    } else {
      insights.push({
        type: 'forecast',
        title: 'Growth Projection',
        content: `At a ${kpis.profitMargin.toFixed(1)}% profit margin, revenue trends support continued profitable growth over the next quarter.`,
        priority: 'normal',
        impact: 'Expansion',
      });
    }

    const exceeded = health.budgetSummaries.filter((b) => b.exceeded);
    if (exceeded.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Budget Overruns',
        content: `${exceeded.length} departmental budget(s) exceeded their allocation (${exceeded.map((b) => b.name).join(', ')}). Rein in spending or reallocate funds.`,
        priority: 'high',
        impact: 'Cost Control',
      });
    } else {
      insights.push({
        type: 'recommendation',
        title: 'Budget Allocation',
        content: 'All departmental budgets are within their allocated amounts. Consider reallocating under-utilized budgets toward high-return initiatives.',
        priority: 'normal',
        impact: 'Revenue',
      });
    }

    insights.push({
      type: 'forecast',
      title: 'Runway Forecast',
      content:
        kpis.burnRate > 0
          ? `With a monthly burn rate of $${kpis.burnRate.toFixed(2)}, the organization has approximately ${typeof kpis.runway === 'number' ? kpis.runway : '18'} month(s) of runway.`
          : 'Positive cash flow sustained with no near-term runway pressure.',
      priority: health.status === 'critical' ? 'high' : 'low',
      impact: 'Financial Health',
    });

    return insights;
  }
}

function sanitizeJson(content: string): string {
  return content.replace(/```json/g, '').replace(/```/g, '').trim();
}

function normalizeInsights(raw: RawInsight[] | undefined): FinancialAiInsight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.content === 'string' && item.content.trim().length > 0)
    .map((item) => ({
      type: item.type === 'forecast' || item.type === 'recommendation' || item.type === 'alert' ? item.type : 'recommendation',
      title: typeof item.title === 'string' && item.title.length > 0 ? item.title : 'Financial recommendation',
      content: item.content as string,
      priority: item.priority === 'low' || item.priority === 'high' ? item.priority : 'normal',
      impact: typeof item.impact === 'string' && item.impact.length > 0 ? item.impact : 'Improved financial health',
    }));
}
