import { describe, it, expect, beforeEach } from "@jest/globals";
import { createKnowledgeTestModule, KnowledgeTestContext } from "../testing/test-fixture.js";
import { KnowledgeArticleStatus } from "../types.js";
import { KnowledgeEventType } from "../events/knowledge.events.js";

describe("Knowledge article lifecycle", () => {
  let ctx: KnowledgeTestContext;
  const orgId = "org-article-1";

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
  });

  async function createSample(title = "Sales Playbook", category = "Sales") {
    return ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.createArticle({
        title,
        summary: "How to sell",
        content: "The sales playbook explains negotiation.",
        category,
        tags: ["sales", "playbook"],
      }),
    );
  }

  it("should create a draft article with version 1", async () => {
    const article = await createSample();
    expect(article.status).toBe(KnowledgeArticleStatus.DRAFT);
    expect(article.version).toBe(1);
    expect(article.organizationId).toBe(orgId);
    expect(article.tags).toEqual(["sales", "playbook"]);
  });

  it("should publish a draft article and set publishedAt", async () => {
    const article = await createSample();
    const published = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.publishArticle(article.id, orgId),
    );
    expect(published.status).toBe(KnowledgeArticleStatus.PUBLISHED);
    expect(published.publishedAt).toBeDefined();
  });

  it("should be idempotent when publishing an already published article", async () => {
    const article = await createSample();
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.publishArticle(article.id, orgId),
    );
    ctx.events.length = 0;
    const again = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.publishArticle(article.id, orgId),
    );
    expect(again.status).toBe(KnowledgeArticleStatus.PUBLISHED);
    expect(ctx.events.filter((e) => e.type === KnowledgeEventType.ARTICLE_PUBLISHED)).toHaveLength(
      0,
    );
  });

  it("should archive a published article", async () => {
    const article = await createSample();
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.publishArticle(article.id, orgId),
    );
    const archived = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.archiveArticle(article.id, orgId),
    );
    expect(archived.status).toBe(KnowledgeArticleStatus.ARCHIVED);
  });

  it("should list articles filtered by status and category", async () => {
    await createSample("Sales Playbook");
    await createSample("Operations Guide", "Operations");

    const all = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.listArticles(orgId),
    );
    expect(all).toHaveLength(2);

    const published = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.listArticles(orgId, KnowledgeArticleStatus.DRAFT),
    );
    expect(published).toHaveLength(2);

    const sales = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.listArticles(orgId, undefined, "Sales"),
    );
    expect(sales).toHaveLength(1);
    expect(sales[0].category).toBe("Sales");
  });

  it("should enforce strict tenant isolation", async () => {
    const article = await createSample();
    ctx.events.length = 0;

    await expect(
      ctx.tenantContext.runAsync({ tenantId: "org-attacker" }, () =>
        ctx.articleService.getArticle(article.id, "org-attacker"),
      ),
    ).rejects.toThrow("Article not found");

    await expect(
      ctx.tenantContext.runAsync({ tenantId: "org-attacker" }, () =>
        ctx.articleService.publishArticle(article.id, "org-attacker"),
      ),
    ).rejects.toThrow("Article not found");

    const attackerList = await ctx.tenantContext.runAsync({ tenantId: "org-attacker" }, () =>
      ctx.articleService.listArticles("org-attacker"),
    );
    expect(attackerList).toHaveLength(0);
  });

  it("should publish canonical events carrying the tenant scope", async () => {
    const article = await createSample();
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.publishArticle(article.id, orgId),
    );

    const scoped = ctx.events.filter((e) => e.tenantId === orgId);
    const types = scoped.map((e) => e.type);
    expect(types).toContain(KnowledgeEventType.ARTICLE_CREATED);
    expect(types).toContain(KnowledgeEventType.ARTICLE_PUBLISHED);

    const created = scoped.find((e) => e.type === KnowledgeEventType.ARTICLE_CREATED);
    expect(created?.payload).toMatchObject({ title: "Sales Playbook" });
  });
});
