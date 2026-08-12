import { Inject, Injectable } from '@nestjs/common';
import { KNOWLEDGE_ARTICLE_REPOSITORY, type ArticleRepository } from '../repositories/article.repository.js';
import { KNOWLEDGE_INDEX_REPOSITORY, type IndexRepository } from '../repositories/index.repository.js';
import { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeSearchResult } from '../types.js';
import { IndexService } from './index.service.js';
import { TenantContextService } from '@oracle69/runtime';

/**
 * Tenant-scoped knowledge search. Scores published articles by the weighted
 * keyword index built by {@link IndexService}; when an article has not been
 * indexed yet it falls back to a deterministic substring match over the title
 * and content, so search always returns useful results.
 */
@Injectable()
export class SearchService {
  constructor(
    @Inject(KNOWLEDGE_ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
    @Inject(KNOWLEDGE_INDEX_REPOSITORY) private readonly indexRepo: IndexRepository,
    private readonly indexService: IndexService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async search(
    organizationId?: string,
    query?: string,
    limit = 10,
    status: KnowledgeArticleStatus = KnowledgeArticleStatus.PUBLISHED,
  ): Promise<KnowledgeSearchResult[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    if (!query || query.trim().length === 0) return [];

    const tokens = this.indexService.tokenize(query);
    const [articles, indexEntries] = await Promise.all([
      this.articleRepo.findByOrganization(tenantId, status),
      tokens.length > 0 ? this.indexRepo.findByTokens(tenantId, tokens) : Promise.resolve([]),
    ]);

    const indexedArticles = new Set(indexEntries.map((e) => e.articleId));
    const scoreByArticle = new Map<string, number>();
    for (const entry of indexEntries) {
      scoreByArticle.set(entry.articleId, (scoreByArticle.get(entry.articleId) ?? 0) + entry.weight);
    }

    const lowerQuery = query.toLowerCase();
    const results: KnowledgeSearchResult[] = [];

    for (const article of articles) {
      let score = scoreByArticle.get(article.id) ?? 0;
      if (score === 0) {
        const fallback = this.substringScore(article, lowerQuery);
        if (fallback === 0) continue;
        score = fallback;
      }
      results.push({
        articleId: article.id,
        title: article.title,
        category: article.category,
        status: article.status,
        version: article.version,
        score: roundScore(score),
        excerpt: this.buildExcerpt(article, lowerQuery),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  private substringScore(article: KnowledgeArticle, lowerQuery: string): number {
    const title = article.title.toLowerCase();
    const content = article.content.toLowerCase();
    if (title.includes(lowerQuery)) return 0.9;
    if (content.includes(lowerQuery)) return 0.6;
    return 0;
  }

  private buildExcerpt(article: KnowledgeArticle, lowerQuery: string, window = 80): string {
    const index = article.content.toLowerCase().indexOf(lowerQuery);
    if (index === -1) {
      const cleaned = article.content.replace(/\s+/g, ' ').trim();
      return cleaned.length > window ? `${cleaned.slice(0, window)}...` : cleaned;
    }
    const start = Math.max(0, index - 30);
    const snippet = article.content.slice(start, index + lowerQuery.length + window).replace(/\s+/g, ' ').trim();
    return start > 0 ? `...${snippet}...` : snippet;
  }
}

function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}
