import { describe, it, expect, beforeEach } from '@jest/globals';
import { createKnowledgeTestModule, KnowledgeTestContext } from '../testing/test-fixture.js';
import { KnowledgeArticleStatus } from '../types.js';
import { KnowledgeEventType } from '../events/knowledge.events.js';

describe('Knowledge indexing and search', () => {
  let ctx: KnowledgeTestContext;
  const orgId = 'org-index-1';

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
  });

  it('should tokenize text with stop-word removal', () => {
    const tokens = ctx.indexService.tokenize('The Sales Playbook and the negotiation guide');
    expect(tokens).toContain('sales');
    expect(tokens).toContain('playbook');
    expect(tokens).toContain('negotiation');
    expect(tokens).toContain('guide');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('and');
  });

  it('should weight title, tags, summary and content tokens', () => {
    const tokens = ctx.indexService.buildTokens({
      title: 'Sales Playbook',
      summary: 'How to sell',
      content: 'The playbook explains negotiation best practices.',
      tags: ['sales'],
    });
    const sales = tokens.find((t) => t.token === 'sales');
    const playbook = tokens.find((t) => t.token === 'playbook');
    const negotiation = tokens.find((t) => t.token === 'negotiation');
    expect(sales).toBeDefined();
    expect(playbook).toBeDefined();
    expect(negotiation).toBeDefined();
    expect((sales as { weight: number }).weight).toBeGreaterThan((negotiation as { weight: number }).weight);
    expect((playbook as { weight: number }).weight).toBeGreaterThan((negotiation as { weight: number }).weight);
  });

  it('should reindex an article and publish the index event', async () => {
    const article = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.createArticle({
        title: 'Security Playbook',
        summary: 'Incident response',
        content: 'How to respond to a security incident.',
        category: 'Security',
        tags: ['security'],
      }),
    );

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.indexService.reindexArticle(article.id, orgId),
    );

    const entries = await ctx.indexRepo.findByOrganization(orgId);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.token === 'security')).toBe(true);
    expect(ctx.events.some((e) => e.type === KnowledgeEventType.INDEX_UPDATED && e.tenantId === orgId)).toBe(true);
  });

  it('should reindex all articles in a tenant', async () => {
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const a1 = await ctx.articleService.createArticle({ title: 'A Guide', content: 'Guide content A', category: 'Ops', tags: [] });
      const a2 = await ctx.articleService.createArticle({ title: 'B Guide', content: 'Guide content B', category: 'Sales', tags: [] });
      const count = await ctx.indexService.reindexAll(orgId);
      expect(count).toBe(2);
      const entries = await ctx.indexRepo.findByOrganization(orgId);
      const articles = new Set(entries.map((e) => e.articleId));
      expect(articles.has(a1.id)).toBe(true);
      expect(articles.has(a2.id)).toBe(true);
    });
  });

  it('should rank published articles by index score', async () => {
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const sales = await ctx.articleService.createArticle({
        title: 'Sales Playbook',
        content: 'Sales negotiation and closing techniques.',
        category: 'Sales',
        tags: [],
      });
      const ops = await ctx.articleService.createArticle({
        title: 'Operations Guide',
        content: 'How the sales pipeline data flows into reports.',
        category: 'Operations',
        tags: [],
      });
      await ctx.articleService.publishArticle(sales.id, orgId);
      await ctx.articleService.publishArticle(ops.id, orgId);
      await ctx.indexService.reindexAll(orgId);

      const results = await ctx.searchService.search(orgId, 'sales');
      expect(results.length).toBe(2);
      expect(results[0].articleId).toBe(sales.id);
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results.every((r) => r.status === KnowledgeArticleStatus.PUBLISHED)).toBe(true);
    });
  });

  it('should fall back to substring matching when an article is not indexed', async () => {
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const article = await ctx.articleService.createArticle({
        title: 'Unindexed Memo',
        content: 'This memo explains the quarterly budget review process.',
        category: 'Finance',
        tags: [],
      });
      await ctx.articleService.publishArticle(article.id, orgId);

      const results = await ctx.searchService.search(orgId, 'quarterly budget');
      expect(results.some((r) => r.articleId === article.id)).toBe(true);
    });
  });

  it('should return no results for an empty query', async () => {
    const results = await ctx.searchService.search(orgId, '  ');
    expect(results).toEqual([]);
  });

  it('should respect article status filtering in search', async () => {
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const draft = await ctx.articleService.createArticle({
        title: 'Draft Memo',
        content: 'Sales targets for next quarter.',
        category: 'Sales',
        tags: [],
      });

      const results = await ctx.searchService.search(orgId, 'sales');
      expect(results.some((r) => r.articleId === draft.id)).toBe(false);

      const draftResults = await ctx.searchService.search(orgId, 'sales', 10, KnowledgeArticleStatus.DRAFT);
      expect(draftResults.some((r) => r.articleId === draft.id)).toBe(true);
    });
  });

  it('should isolate search results by tenant', async () => {
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const article = await ctx.articleService.createArticle({
        title: 'Confidential Playbook',
        content: 'Confidential negotiation tactics.',
        category: 'Sales',
        tags: [],
      });
      await ctx.articleService.publishArticle(article.id, orgId);

      const otherTenant = await ctx.searchService.search('org-other', 'confidential');
      expect(otherTenant.some((r) => r.articleId === article.id)).toBe(false);
    });
  });
});
