import { Injectable } from '@nestjs/common';
import { KnowledgeKpiService } from './knowledge-kpi.service.js';
import { KnowledgeHealth } from '../types.js';

const HEALTH_FACTORS: Record<'healthy' | 'at_risk' | 'critical', number> = {
  healthy: 80,
  at_risk: 55,
  critical: 30,
};

/**
 * Assembles a tenant-scoped knowledge health snapshot from the persisted
 * knowledge KPIs. The deterministic score is derived from content volume,
 * index coverage, staleness and draft backlog, and is consumed by the AI
 * insight service for knowledge health analysis and recommendations.
 */
@Injectable()
export class KnowledgeHealthService {
  constructor(private readonly kpiService: KnowledgeKpiService) {}

  async assess(organizationId?: string): Promise<KnowledgeHealth> {
    const kpis = await this.kpiService.getKpis(organizationId);

    const reasoning: string[] = [];
    let score = HEALTH_FACTORS.healthy;

    if (kpis.totalArticles === 0) {
      score = HEALTH_FACTORS.critical - 10;
      reasoning.push('No knowledge articles are on record; the knowledge base is empty.');
    } else {
      reasoning.push(
        `The knowledge base holds ${kpis.totalArticles} article(s) across ${kpis.categories.length} categor(ies) ` +
          `(${kpis.publishedCount} published, ${kpis.draftCount} draft).`,
      );
    }

    if (kpis.indexCoverage < 0.5) {
      score -= 20;
      reasoning.push(
        `Only ${(kpis.indexCoverage * 100).toFixed(0)}% of articles are indexed; search coverage is low.`,
      );
    } else if (kpis.indexCoverage < 0.8) {
      score -= 10;
      reasoning.push(`${(kpis.indexCoverage * 100).toFixed(0)}% of articles are indexed for search.`);
    }

    if (kpis.staleArticles > 0) {
      score -= Math.min(kpis.staleArticles * 5, 20);
      reasoning.push(`${kpis.staleArticles} article(s) have not been updated in over 90 days.`);
    }

    if (kpis.draftBacklog > kpis.publishedCount && kpis.publishedCount > 0) {
      score -= 10;
      reasoning.push('Draft articles outnumber published content; the review pipeline is backed up.');
    }

    if (kpis.averageVersionCount >= 3) {
      reasoning.push('Articles have healthy version histories, indicating active content stewardship.');
    }

    const status: KnowledgeHealth['status'] =
      score >= HEALTH_FACTORS.healthy ? 'healthy' : score >= HEALTH_FACTORS.at_risk ? 'at_risk' : 'critical';

    return {
      score: Math.max(0, Math.min(100, score)),
      status,
      kpis,
      reasoning,
    };
  }
}
