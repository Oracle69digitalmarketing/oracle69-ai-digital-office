import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { OrgClaimGuard } from "@oracle69/shared";
import { ArticleService } from "../services/article.service.js";
import { IndexService } from "../services/index.service.js";
import { SearchService } from "../services/search.service.js";
import { KnowledgeKpiService } from "../services/knowledge-kpi.service.js";
import { KnowledgeHealthService } from "../services/knowledge-health.service.js";
import { KnowledgeAiService } from "../services/knowledge-ai.service.js";
import { RecommendationService } from "../services/recommendation.service.js";
import { KnowledgeReportService } from "../services/knowledge-report.service.js";
import { KnowledgeArticleStatus } from "../types.js";
import { TenantContextService } from "@oracle69/runtime";

/**
 * Tenant-scoped REST surface for Knowledge Intelligence.
 *
 * Every route is executed inside a {@link TenantContextService} scope resolved
 * from the `organizationId` path segment, so the canonical services and the
 * EventBus inherit the tenant without any cross-tenant reads or writes.
 */
@Controller("knowledge")
@UseGuards(OrgClaimGuard)
export class KnowledgeController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly indexService: IndexService,
    private readonly searchService: SearchService,
    private readonly kpiService: KnowledgeKpiService,
    private readonly healthService: KnowledgeHealthService,
    private readonly aiService: KnowledgeAiService,
    private readonly recommendationService: RecommendationService,
    private readonly reportService: KnowledgeReportService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(":organizationId/articles")
  listArticles(
    @Param("organizationId") organizationId: string,
    @Query("status") status?: KnowledgeArticleStatus,
    @Query("category") category?: string,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.listArticles(organizationId, status, category),
    );
  }

  @Post(":organizationId/articles")
  createArticle(@Param("organizationId") organizationId: string, @Body() body: any) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.createArticle({ ...body, organizationId }),
    );
  }

  @Get(":organizationId/articles/:id")
  getArticle(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.getArticle(id, organizationId),
    );
  }

  @Patch(":organizationId/articles/:id")
  updateArticle(
    @Param("organizationId") organizationId: string,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.updateArticle(id, body, organizationId, body.changeNote),
    );
  }

  @Post(":organizationId/articles/:id/publish")
  publishArticle(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.publishArticle(id, organizationId),
    );
  }

  @Post(":organizationId/articles/:id/archive")
  archiveArticle(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.archiveArticle(id, organizationId),
    );
  }

  @Get(":organizationId/articles/:id/versions")
  getVersionHistory(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.getVersionHistory(id, organizationId),
    );
  }

  @Get(":organizationId/articles/:id/versions/:version")
  getVersion(
    @Param("organizationId") organizationId: string,
    @Param("id") id: string,
    @Param("version") version: string,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.articleService.getVersion(id, Number(version), organizationId),
    );
  }

  @Post(":organizationId/articles/:id/reindex")
  reindexArticle(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.indexService.reindexArticle(id, organizationId),
    );
  }

  @Post(":organizationId/reindex")
  reindexAll(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.indexService.reindexAll(organizationId),
    );
  }

  @Get(":organizationId/search")
  search(
    @Param("organizationId") organizationId: string,
    @Query("q") q?: string,
    @Query("status") status?: KnowledgeArticleStatus,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.searchService.search(organizationId, q, 10, status ?? KnowledgeArticleStatus.PUBLISHED),
    );
  }

  @Get(":organizationId/kpis")
  getKpis(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.kpiService.getKpis(organizationId),
    );
  }

  @Get(":organizationId/health")
  getHealth(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.healthService.assess(organizationId),
    );
  }

  @Get(":organizationId/insights")
  async getInsights(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, async () => {
      const health = await this.healthService.assess(organizationId);
      return this.aiService.generateInsights(health);
    });
  }

  @Get(":organizationId/recommendations")
  async getRecommendations(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, async () => {
      const health = await this.healthService.assess(organizationId);
      return this.recommendationService.generateRecommendations(health, organizationId);
    });
  }

  @Post(":organizationId/reports")
  generateReport(@Param("organizationId") organizationId: string, @Body() body: any) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.reportService.generateReport(organizationId, body?.period),
    );
  }

  @Get(":organizationId/reports")
  listReports(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.reportService.listReports(organizationId),
    );
  }
}
