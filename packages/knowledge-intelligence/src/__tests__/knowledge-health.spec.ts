import { describe, it, expect, beforeEach } from "@jest/globals";
import { createKnowledgeTestModule, KnowledgeTestContext } from "../testing/test-fixture.js";
import { KnowledgeArticleStatus } from "../types.js";

describe("Knowledge health analysis", () => {
  let ctx: KnowledgeTestContext;
  const orgId = "org-health-1";

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
  });

  function seedArticle(id: string, overrides: Partial<Record<string, unknown>> = {}) {
    ctx.articleRepo.seed({
      id,
      title: `Title ${id}`,
      summary: "summary",
      content: "content",
      category: "Operations",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: new Date().toISOString(),
      ...overrides,
    } as any);
  }

  it("should flag an empty knowledge base as critical", async () => {
    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe("critical");
    expect(health.score).toBeLessThanOrEqual(30);
    expect(health.reasoning.some((r) => r.includes("empty"))).toBe(true);
  });

  it("should assess a healthy, well-indexed knowledge base as healthy", async () => {
    seedArticle("h-1");
    seedArticle("h-2");
    seedArticle("h-3", { category: "Sales" });
    await ctx.indexRepo.replaceForArticle("h-1", orgId, [
      { articleId: "h-1", token: "ops", weight: 1, organizationId: orgId },
    ]);
    await ctx.indexRepo.replaceForArticle("h-2", orgId, [
      { articleId: "h-2", token: "ops", weight: 1, organizationId: orgId },
    ]);
    await ctx.indexRepo.replaceForArticle("h-3", orgId, [
      { articleId: "h-3", token: "sales", weight: 1, organizationId: orgId },
    ]);

    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe("healthy");
    expect(health.score).toBeGreaterThanOrEqual(80);
    expect(health.kpis.totalArticles).toBe(3);
    expect(health.reasoning.length).toBeGreaterThan(0);
  });

  it("should penalize low index coverage", async () => {
    seedArticle("h-4");
    seedArticle("h-5");

    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe("at_risk");
    expect(health.score).toBeLessThan(80);
    expect(health.reasoning.some((r) => r.includes("indexed"))).toBe(true);
  });

  it("should penalize stale articles", async () => {
    const stale = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    seedArticle("h-6", { updatedAt: stale });
    await ctx.indexRepo.replaceForArticle("h-6", orgId, [
      { articleId: "h-6", token: "ops", weight: 1, organizationId: orgId },
    ]);

    const health = await ctx.healthService.assess(orgId);
    expect(health.reasoning.some((r) => r.includes("90 days"))).toBe(true);
  });

  it("should penalize a draft backlog that exceeds published content", async () => {
    seedArticle("h-7");
    seedArticle("h-8", { status: KnowledgeArticleStatus.DRAFT });
    seedArticle("h-9", { status: KnowledgeArticleStatus.DRAFT });
    await ctx.indexRepo.replaceForArticle("h-7", orgId, [
      { articleId: "h-7", token: "ops", weight: 1, organizationId: orgId },
    ]);

    const health = await ctx.healthService.assess(orgId);
    expect(health.reasoning.some((r) => r.includes("Draft"))).toBe(true);
  });

  it("should isolate health assessment by tenant", async () => {
    seedArticle("h-other");
    ctx.articleRepo.seed({
      id: "h-other-2",
      title: "Other",
      summary: "s",
      content: "c",
      category: "Ops",
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: "org-other",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: new Date().toISOString(),
    });

    const health = await ctx.healthService.assess("org-other");
    expect(health.kpis.totalArticles).toBe(1);
  });
});
