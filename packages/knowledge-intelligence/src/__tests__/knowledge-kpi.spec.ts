import { describe, it, expect, beforeEach } from "@jest/globals";
import { createKnowledgeTestModule, KnowledgeTestContext } from "../testing/test-fixture.js";
import { KnowledgeArticleStatus } from "../types.js";

describe("Knowledge KPI intelligence", () => {
  let ctx: KnowledgeTestContext;
  const orgId = "org-kpi-1";

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
  });

  it("should compute empty KPIs for a tenant without articles", async () => {
    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.totalArticles).toBe(0);
    expect(kpis.indexCoverage).toBe(0);
    expect(kpis.categories).toEqual([]);
  });

  it("should compute article counts, categories and average version", async () => {
    ctx.articleRepo.seed({
      id: "k-1",
      title: "A",
      summary: "s",
      content: "c",
      category: "Operations",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
    ctx.articleRepo.seed({
      id: "k-2",
      title: "B",
      summary: "s",
      content: "c",
      category: "Sales",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 2,
      organizationId: orgId,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
    ctx.articleRepo.seed({
      id: "k-3",
      title: "C",
      summary: "s",
      content: "c",
      category: "Sales",
      tags: [],
      status: KnowledgeArticleStatus.DRAFT,
      version: 2,
      organizationId: orgId,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
    ctx.articleRepo.seed({
      id: "k-4",
      title: "D",
      summary: "s",
      content: "c",
      category: "Policy",
      tags: [],
      status: KnowledgeArticleStatus.ARCHIVED,
      version: 1,
      organizationId: orgId,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.totalArticles).toBe(4);
    expect(kpis.publishedCount).toBe(2);
    expect(kpis.draftCount).toBe(1);
    expect(kpis.archivedCount).toBe(1);
    expect(kpis.draftBacklog).toBe(1);
    expect(kpis.categories).toEqual(["Operations", "Policy", "Sales"]);
    expect(kpis.averageVersionCount).toBe(1.5);
  });

  it("should compute index coverage from index entries", async () => {
    ctx.articleRepo.seed({
      id: "k-a",
      title: "A",
      summary: "s",
      content: "c",
      category: "Ops",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
    ctx.articleRepo.seed({
      id: "k-b",
      title: "B",
      summary: "s",
      content: "c",
      category: "Ops",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });

    await ctx.indexRepo.replaceForArticle("k-a", orgId, [
      { articleId: "k-a", token: "ops", weight: 1, organizationId: orgId },
    ]);

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.indexedArticles).toBe(1);
    expect(kpis.indexCoverage).toBe(0.5);
  });

  it("should detect stale articles (not updated in 90 days)", async () => {
    const stale = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const fresh = new Date().toISOString();

    ctx.articleRepo.seed({
      id: "k-stale",
      title: "Old",
      summary: "s",
      content: "c",
      category: "Ops",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: stale,
      updatedAt: stale,
    });
    ctx.articleRepo.seed({
      id: "k-fresh",
      title: "New",
      summary: "s",
      content: "c",
      category: "Ops",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: fresh,
      updatedAt: fresh,
    });

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.staleArticles).toBe(1);
  });

  it("should not count archived articles as stale", async () => {
    const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    ctx.articleRepo.seed({
      id: "k-archived",
      title: "Archived",
      summary: "s",
      content: "c",
      category: "Ops",
      tags: [],
      status: KnowledgeArticleStatus.ARCHIVED,
      version: 1,
      organizationId: orgId,
      createdAt: old,
      updatedAt: old,
    });

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.staleArticles).toBe(0);
  });

  it("should isolate KPIs by tenant", async () => {
    ctx.articleRepo.seed({
      id: "k-other",
      title: "Other",
      summary: "s",
      content: "c",
      category: "Ops",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: "org-other",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.totalArticles).toBe(0);
  });
});
