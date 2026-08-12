import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AiModelProvider } from '@oracle69/sales-intelligence';
import { KnowledgeAiInsight, KnowledgeHealth } from '../types.js';

interface RawInsight {
  type?: string;
  title?: string;
  content?: string;
  priority?: string;
  impact?: string;
}

/**
 * Generates knowledge management intelligence insights (health analysis,
 * content growth forecasts and actionable recommendations) from a
 * tenant-scoped {@link KnowledgeHealth} snapshot.
 *
 * The AI path runs through the existing `AiModelProvider` abstraction shared by
 * the sales, enterprise, marketing, operations, financial and HR intelligence
 * packages. When no provider is configured or the model call fails, the service
 * falls back to deterministic insights computed from the knowledge KPIs.
 */
@Injectable()
export class KnowledgeAiService {
  private readonly logger = new Logger(KnowledgeAiService.name);

  constructor(@Inject('AiModelProvider') private readonly modelProvider?: AiModelProvider) {}

  async generateInsights(health: KnowledgeHealth): Promise<KnowledgeAiInsight[]> {
    if (!this.modelProvider || !process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY === 'your_api_key_here') {
      return this.deterministicInsights(health);
    }

    try {
      const instruction = `
        Analyze the knowledge base health snapshot of this organization from a Chief Knowledge Officer perspective.
        Focus on content volume, index coverage, stale articles, draft backlog and actionable improvements.
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
      this.logger.warn(`Knowledge AI insight generation failed; using deterministic fallback: ${(error as Error).message}`);
      return this.deterministicInsights(health);
    }
  }

  private deterministicInsights(health: KnowledgeHealth): KnowledgeAiInsight[] {
    const insights: KnowledgeAiInsight[] = [];
    const { kpis } = health;

    if (kpis.totalArticles === 0) {
      insights.push({
        type: 'alert',
        title: 'Empty Knowledge Base',
        content: 'No knowledge articles are on record. Establish an editorial process to capture institutional knowledge.',
        priority: 'high',
        impact: 'Institutional Knowledge',
      });
    } else {
      insights.push({
        type: 'forecast',
        title: 'Knowledge Base Growth',
        content: `With ${kpis.publishedCount} published article(s) across ${kpis.categories.length} categor(ies), the knowledge base supports a repeatable onboarding and decision framework.`,
        priority: 'normal',
        impact: 'Organizational Learning',
      });
    }

    if (kpis.indexCoverage < 0.8) {
      insights.push({
        type: 'alert',
        title: 'Search Coverage Gap',
        content: `Only ${(kpis.indexCoverage * 100).toFixed(0)}% of articles are indexed. Re-index the knowledge base so every article is discoverable.`,
        priority: 'high',
        impact: 'Knowledge Discovery',
      });
    } else if (kpis.totalArticles > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Indexed Knowledge Base',
        content: `${(kpis.indexCoverage * 100).toFixed(0)}% of articles are indexed, keeping search results complete and current.`,
        priority: 'low',
        impact: 'Knowledge Discovery',
      });
    }

    if (kpis.staleArticles > 0) {
      insights.push({
        type: 'alert',
        title: 'Stale Content',
        content: `${kpis.staleArticles} article(s) have not been updated in over 90 days. Schedule a refresh to keep institutional knowledge accurate.`,
        priority: 'normal',
        impact: 'Content Accuracy',
      });
    } else {
      insights.push({
        type: 'forecast',
        title: 'Content Freshness',
        content: kpis.totalArticles > 0
          ? 'All articles are up to date; the knowledge base remains accurate and reliable.'
          : 'No articles to assess for freshness yet.',
        priority: 'low',
        impact: 'Content Accuracy',
      });
    }

    if (kpis.draftBacklog > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Clear Draft Backlog',
        content: `${kpis.draftBacklog} draft(s) await review. Assign owners and publish vetted content to grow the institutional knowledge base.`,
        priority: 'normal',
        impact: 'Editorial Velocity',
      });
    }

    return insights;
  }
}

function sanitizeJson(content: string): string {
  return content.replace(/```json/g, '').replace(/```/g, '').trim();
}

function normalizeInsights(raw: RawInsight[] | undefined): KnowledgeAiInsight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.content === 'string' && item.content.trim().length > 0)
    .map((item) => ({
      type: item.type === 'forecast' || item.type === 'recommendation' || item.type === 'alert' ? item.type : 'recommendation',
      title: typeof item.title === 'string' && item.title.length > 0 ? item.title : 'Knowledge recommendation',
      content: item.content as string,
      priority: item.priority === 'low' || item.priority === 'high' ? item.priority : 'normal',
      impact: typeof item.impact === 'string' && item.impact.length > 0 ? item.impact : 'Improved knowledge health',
    }));
}
