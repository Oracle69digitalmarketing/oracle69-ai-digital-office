import { Inject, Injectable } from "@nestjs/common";
import {
  KNOWLEDGE_ARTICLE_REPOSITORY,
  type ArticleRepository,
} from "../repositories/article.repository.js";
import { KnowledgeArticle, KnowledgeHealth, KnowledgeRecommendation } from "../types.js";
import { TenantContextService } from "@oracle69/runtime";

const STALE_DAYS = 90;
const MIN_ARTICLES_PER_CATEGORY = 2;

/**
 * Produces tenant-scoped, deterministic knowledge management recommendations
 * from the knowledge health snapshot: content gaps, stale-article refreshes,
 * draft backlog, search coverage and potential duplication.
 */
@Injectable()
export class RecommendationService {
  constructor(
    @Inject(KNOWLEDGE_ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async generateRecommendations(
    health: KnowledgeHealth,
    organizationId?: string,
  ): Promise<KnowledgeRecommendation[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const articles = await this.articleRepo.findByOrganization(tenantId);
    const recommendations: KnowledgeRecommendation[] = [];

    if (health.kpis.totalArticles === 0) {
      recommendations.push({
        title: "Establish the Knowledge Base",
        reason:
          "No articles are on record. Seed the base with onboarding, process and policy documentation.",
        priority: "high",
      });
      return recommendations;
    }

    this.addContentGaps(articles, recommendations);
    this.addStaleContent(articles, recommendations);
    this.addIndexCoverage(health, recommendations);
    this.addDraftBacklog(health, recommendations);
    this.addDuplication(articles, recommendations);

    return recommendations;
  }

  private addContentGaps(
    articles: KnowledgeArticle[],
    recommendations: KnowledgeRecommendation[],
  ): void {
    const byCategory = new Map<string, number>();
    for (const article of articles) {
      byCategory.set(article.category, (byCategory.get(article.category) ?? 0) + 1);
    }
    const thinCategories = Array.from(byCategory.entries())
      .filter(([, count]) => count < MIN_ARTICLES_PER_CATEGORY)
      .map(([category]) => category);
    for (const category of thinCategories) {
      recommendations.push({
        title: `Coverage gap in ${category}`,
        reason: `Category "${category}" has fewer than ${MIN_ARTICLES_PER_CATEGORY} article(s). Expand it to reduce knowledge gaps.`,
        priority: "normal",
        category,
      });
    }
  }

  private addStaleContent(
    articles: KnowledgeArticle[],
    recommendations: KnowledgeRecommendation[],
  ): void {
    const staleThreshold = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
    const stale = articles.filter((a) => {
      if (a.status === "archived") return false;
      const updated = Date.parse(a.updatedAt);
      return !Number.isNaN(updated) && updated < staleThreshold;
    });
    if (stale.length > 0) {
      recommendations.push({
        title: "Refresh stale articles",
        reason: `${stale.length} article(s) have not been updated in over 90 days: ${stale
          .slice(0, 3)
          .map((a) => a.title)
          .join(", ")}${stale.length > 3 ? "..." : ""}.`,
        priority: "high",
      });
    }
  }

  private addIndexCoverage(
    health: KnowledgeHealth,
    recommendations: KnowledgeRecommendation[],
  ): void {
    if (health.kpis.indexCoverage < 0.8) {
      recommendations.push({
        title: "Re-index the knowledge base",
        reason: `Only ${(health.kpis.indexCoverage * 100).toFixed(0)}% of articles are indexed. Run a full re-index so search returns complete results.`,
        priority: "high",
      });
    }
  }

  private addDraftBacklog(
    health: KnowledgeHealth,
    recommendations: KnowledgeRecommendation[],
  ): void {
    if (health.kpis.draftBacklog > 0) {
      recommendations.push({
        title: "Clear the draft backlog",
        reason: `${health.kpis.draftBacklog} draft(s) await review. Assign owners and publish vetted content.`,
        priority: "normal",
      });
    }
  }

  private addDuplication(
    articles: KnowledgeArticle[],
    recommendations: KnowledgeRecommendation[],
  ): void {
    const seen = new Map<string, string>();
    const duplicates: Array<{ a: string; b: string }> = [];
    for (const article of articles) {
      const normalized = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      if (seen.has(normalized)) {
        duplicates.push({ a: seen.get(normalized) as string, b: article.title });
      } else {
        seen.set(normalized, article.title);
      }
    }
    if (duplicates.length > 0) {
      recommendations.push({
        title: "Merge duplicate articles",
        reason: `${duplicates.length} article(s) share the same title as an existing article. Consolidate them to avoid conflicting knowledge.`,
        priority: "normal",
      });
    }
  }
}
