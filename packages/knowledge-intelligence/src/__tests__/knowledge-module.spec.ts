import { describe, it, expect, beforeEach } from '@jest/globals';
import { EventCatalogService } from '@oracle69/runtime';
import { KnowledgeIntelligenceModule } from '../knowledge-intelligence.module.js';
import { KnowledgeEventType } from '../events/knowledge.events.js';
import { createKnowledgeTestModule, KnowledgeTestContext } from '../testing/test-fixture.js';
import { KnowledgeArticleStatus } from '../types.js';

describe('Knowledge Intelligence module (Event Bus integration)', () => {
  let ctx: KnowledgeTestContext;

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  it('should register Knowledge domain events in the canonical Event Catalog', () => {
    const catalog = new EventCatalogService();
    new KnowledgeIntelligenceModule(catalog);

    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_CREATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_UPDATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_PUBLISHED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_ARCHIVED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_VERSION_CREATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.INDEX_UPDATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.REPORT_GENERATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.INSIGHT_GENERATED)).toBe(true);

    const entry = catalog.entry(KnowledgeEventType.ARTICLE_PUBLISHED);
    expect(entry?.description).toContain('published');
    expect(catalog.entry(KnowledgeEventType.ARTICLE_CREATED)?.category).toBe('executive');
  });

  it('should publish canonical Knowledge events through the shared EventBus', async () => {
    const orgId = 'org-module-1';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const article = await ctx.articleService.createArticle({
        title: 'Onboarding Playbook',
        summary: 'First 30 days',
        content: 'How to onboard new employees.',
        category: 'Operations',
        tags: ['onboarding'],
      });

      await ctx.articleService.publishArticle(article.id);
      await ctx.articleService.updateArticle(article.id, { content: 'Updated onboarding content.' });
      await ctx.indexService.reindexArticle(article.id);
    });

    const published = ctx.events.filter((e) => e.tenantId === orgId);
    const types = published.map((e) => e.type);
    expect(types).toContain(KnowledgeEventType.ARTICLE_CREATED);
    expect(types).toContain(KnowledgeEventType.ARTICLE_PUBLISHED);
    expect(types).toContain(KnowledgeEventType.ARTICLE_UPDATED);
    expect(types).toContain(KnowledgeEventType.ARTICLE_VERSION_CREATED);
    expect(types).toContain(KnowledgeEventType.INDEX_UPDATED);

    const created = published.find((e) => e.type === KnowledgeEventType.ARTICLE_CREATED);
    expect(created).toBeDefined();
    expect(created.payload).toMatchObject({ title: 'Onboarding Playbook', status: KnowledgeArticleStatus.DRAFT });
  });
});
