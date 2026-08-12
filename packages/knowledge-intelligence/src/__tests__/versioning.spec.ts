import { describe, it, expect, beforeEach } from '@jest/globals';
import { createKnowledgeTestModule, KnowledgeTestContext } from '../testing/test-fixture.js';
import { KnowledgeEventType } from '../events/knowledge.events.js';

describe('Knowledge article versioning', () => {
  let ctx: KnowledgeTestContext;
  const orgId = 'org-version-1';

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
  });

  async function createSample() {
    return ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.createArticle({
        title: 'Policy',
        summary: 'Original summary',
        content: 'Original content',
        category: 'Policy',
        tags: ['policy'],
      }),
    );
  }

  it('should snapshot the previous version and increment on update', async () => {
    const article = await createSample();

    const updated = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.updateArticle(article.id, { content: 'Updated content' }, orgId),
    );
    expect(updated.version).toBe(2);
    expect(updated.content).toBe('Updated content');

    const history = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.getVersionHistory(article.id, orgId),
    );
    expect(history).toHaveLength(1);
    expect(history[0].version).toBe(1);
    expect(history[0].content).toBe('Original content');
  });

  it('should return the snapshot for old versions and the article for the current version', async () => {
    const article = await createSample();
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.updateArticle(article.id, { content: 'v2 content' }, orgId),
    );
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.updateArticle(article.id, { content: 'v3 content' }, orgId, 'Major revision'),
    );

    const v1 = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.getVersion(article.id, 1, orgId),
    );
    expect(v1).toMatchObject({ version: 1, content: 'Original content' });

    const v2 = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.getVersion(article.id, 2, orgId),
    );
    expect(v2).toMatchObject({ version: 2, content: 'v2 content' });

    const current = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.getVersion(article.id, 3, orgId),
    );
    expect(current).toMatchObject({ version: 3, content: 'v3 content' });
    expect(current).toHaveProperty('id', article.id);
  });

  it('should record the change note on version snapshots', async () => {
    const article = await createSample();
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.updateArticle(article.id, { title: 'Policy v2' }, orgId, 'Reflects new regulations'),
    );

    const history = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.getVersionHistory(article.id, orgId),
    );
    expect(history[0].changeNote).toBe('Reflects new regulations');
  });

  it('should list versions in descending order', async () => {
    const article = await createSample();
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.updateArticle(article.id, { content: 'c2' }, orgId),
    );
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.updateArticle(article.id, { content: 'c3' }, orgId),
    );

    const history = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.getVersionHistory(article.id, orgId),
    );
    expect(history.map((h) => h.version)).toEqual([2, 1]);
  });

  it('should throw when fetching an unknown version', async () => {
    const article = await createSample();
    await expect(
      ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
        ctx.articleService.getVersion(article.id, 99, orgId),
      ),
    ).rejects.toThrow('Article version not found');
  });

  it('should enforce tenant isolation on version access', async () => {
    const article = await createSample();
    await expect(
      ctx.tenantContext.runAsync({ tenantId: 'org-attacker' }, () =>
        ctx.articleService.getVersionHistory(article.id, 'org-attacker'),
      ),
    ).rejects.toThrow('Article not found');
  });

  it('should publish versioning events', async () => {
    const article = await createSample();
    ctx.events.length = 0;

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.articleService.updateArticle(article.id, { content: 'c2' }, orgId),
    );

    const types = ctx.events.map((e) => e.type);
    expect(types).toContain(KnowledgeEventType.ARTICLE_VERSION_CREATED);
    expect(types).toContain(KnowledgeEventType.ARTICLE_UPDATED);
  });
});
