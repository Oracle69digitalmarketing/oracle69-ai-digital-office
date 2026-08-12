import { Inject, Injectable } from '@nestjs/common';
import { KNOWLEDGE_ARTICLE_REPOSITORY, type ArticleRepository } from '../repositories/article.repository.js';
import { KNOWLEDGE_INDEX_REPOSITORY, type IndexRepository } from '../repositories/index.repository.js';
import { KnowledgeArticleStatus, KnowledgeKpis } from '../types.js';
import { TenantContextService } from '@oracle69/runtime';

const STALE_DAYS = 90;

/**
 * Computes tenant-scoped knowledge management KPIs from the persisted articles
 * and their index coverage. Feeds the health analysis, AI insights,
 * recommendations and reports.
 */
@Injectable()
export class KnowledgeKpiService {
  constructor(
    @Inject(KNOWLEDGE_ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
    @Inject(KNOWLEDGE_INDEX_REPOSITORY) private readonly indexRepo: IndexRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getKpis(organizationId?: string): Promise<KnowledgeKpis> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const [articles, counts] = await Promise.all([
      this.articleRepo.findByOrganization(tenantId),
      this.indexRepo.countByArticle(tenantId),
    ]);

    const totalArticles = articles.length;
    const draftCount = articles.filter((a) => a.status === KnowledgeArticleStatus.DRAFT).length;
    const publishedCount = articles.filter((a) => a.status === KnowledgeArticleStatus.PUBLISHED).length;
    const archivedCount = articles.filter((a) => a.status === KnowledgeArticleStatus.ARCHIVED).length;
    const categories = Array.from(new Set(articles.map((a) => a.category))).sort();

    const averageVersionCount =
      totalArticles > 0
        ? Math.round((articles.reduce((sum, a) => sum + a.version, 0) / totalArticles) * 10) / 10
        : 0;

    const staleThreshold = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
    const staleArticles = articles.filter((a) => {
      if (a.status === KnowledgeArticleStatus.ARCHIVED) return false;
      const updated = Date.parse(a.updatedAt);
      return !Number.isNaN(updated) && updated < staleThreshold;
    }).length;

    const indexedArticles = articles.filter((a) => (counts.get(a.id) ?? 0) > 0).length;
    const indexCoverage = totalArticles > 0 ? indexedArticles / totalArticles : 0;

    return {
      totalArticles,
      draftCount,
      publishedCount,
      archivedCount,
      categories,
      averageVersionCount,
      indexedArticles,
      indexCoverage,
      staleArticles,
      draftBacklog: draftCount,
    };
  }
}
