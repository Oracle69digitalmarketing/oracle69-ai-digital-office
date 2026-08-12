import { describe, it, expect, beforeEach } from '@jest/globals';
import { createKnowledgeTestModule, KnowledgeTestContext } from '../testing/test-fixture.js';
import { KnowledgeArticleStatus } from '../types.js';

describe('Knowledge recommendations', () => {
  let ctx: KnowledgeTestContext;
  const orgId = 'org-rec-1';

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
  });

  function baseHealth(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      score: 60,
      status: 'at_risk' as const,
      kpis: {
        totalArticles: 3,
        draftCount: 0,
        publishedCount: 3,
        archivedCount: 0,
        categories: ['Operations'],
        averageVersionCount: 1,
        indexedArticles: 3,
        indexCoverage: 1,
        staleArticles: 0,
        draftBacklog: 0,
      },
      reasoning: [],
      ...overrides,
    };
  }

  function seedArticle(id: string, title: string, category = 'Operations', overrides: Partial<Record<string, unknown>> = {}) {
    ctx.articleRepo.seed({
      id,
      title,
      summary: 'summary',
      content: 'content',
      category,
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      ...overrides,
    } as any);
  }

  it('should recommend seeding the knowledge base when empty', async () => {
    const recs = await ctx.recommendationService.generateRecommendations(baseHealth({ kpis: { ...baseHealth().kpis, totalArticles: 0 } }), orgId);
    expect(recs[0].title).toContain('Establish');
    expect(recs[0].priority).toBe('high');
  });

  it('should flag categories with sparse coverage', async () => {
    seedArticle('r-1', 'One', 'Operations');
    seedArticle('r-2', 'Two', 'Sales');
    seedArticle('r-3', 'Three', 'Marketing');

    const recs = await ctx.recommendationService.generateRecommendations(baseHealth(), orgId);
    expect(recs.some((r) => r.title.includes('Coverage gap in Operations'))).toBe(true);
  });

  it('should recommend refreshing stale articles', async () => {
    const stale = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    seedArticle('r-1', 'One');
    seedArticle('r-2', 'Two');
    seedArticle('r-3', 'Three', 'Operations', { updatedAt: stale });

    const recs = await ctx.recommendationService.generateRecommendations(baseHealth({ kpis: { ...baseHealth().kpis, staleArticles: 1 } }), orgId);
    expect(recs.some((r) => r.title.includes('Refresh stale'))).toBe(true);
  });

  it('should recommend re-indexing when coverage is low', async () => {
    seedArticle('r-1', 'One');
    seedArticle('r-2', 'Two');
    seedArticle('r-3', 'Three');

    const recs = await ctx.recommendationService.generateRecommendations(
      baseHealth({ kpis: { ...baseHealth().kpis, indexCoverage: 0.4 } }),
      orgId,
    );
    expect(recs.some((r) => r.title.includes('Re-index'))).toBe(true);
  });

  it('should recommend clearing the draft backlog', async () => {
    seedArticle('r-1', 'One');
    seedArticle('r-2', 'Two');
    seedArticle('r-3', 'Three');

    const recs = await ctx.recommendationService.generateRecommendations(
      baseHealth({ kpis: { ...baseHealth().kpis, draftBacklog: 5 } }),
      orgId,
    );
    expect(recs.some((r) => r.title.includes('draft backlog'))).toBe(true);
  });

  it('should recommend merging duplicate articles', async () => {
    seedArticle('r-1', 'Sales Playbook');
    seedArticle('r-2', 'Sales  Playbook', 'Sales');
    seedArticle('r-3', 'Operations Guide', 'Operations');

    const recs = await ctx.recommendationService.generateRecommendations(baseHealth(), orgId);
    expect(recs.some((r) => r.title.includes('Merge duplicate'))).toBe(true);
  });

  it('should isolate recommendations by tenant', async () => {
    ctx.articleRepo.seed({
      id: 'r-other',
      title: 'Other',
      summary: 's',
      content: 'c',
      category: 'Ops',
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: 'org-other',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    });

    const recs = await ctx.recommendationService.generateRecommendations(
      baseHealth({ kpis: { ...baseHealth().kpis, totalArticles: 0 } }),
      orgId,
    );
    expect(recs.some((r) => r.title.includes('Establish'))).toBe(true);
  });
});
