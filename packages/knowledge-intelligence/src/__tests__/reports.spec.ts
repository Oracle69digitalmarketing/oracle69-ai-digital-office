import { describe, it, expect, beforeEach } from '@jest/globals';
import { createKnowledgeTestModule, KnowledgeTestContext } from '../testing/test-fixture.js';
import { KnowledgeArticleStatus } from '../types.js';
import { KnowledgeEventType } from '../events/knowledge.events.js';

describe('Knowledge reports', () => {
  let ctx: KnowledgeTestContext;
  const orgId = 'org-report-1';

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
  });

  it('should generate and persist a report for the current period', async () => {
    ctx.articleRepo.seed({
      id: 'rep-1',
      title: 'Playbook',
      summary: 's',
      content: 'c',
      category: 'Operations',
      tags: [],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: orgId,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    });
    await ctx.indexRepo.replaceForArticle('rep-1', orgId, [
      { articleId: 'rep-1', token: 'ops', weight: 1, organizationId: orgId },
    ]);

    const report = await ctx.reportService.generateReport(orgId, '2026-08');

    expect(report.period).toBe('2026-08');
    expect(report.organizationId).toBe(orgId);
    expect(report.knowledgeScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.kpis.totalArticles).toBe(1);
    expect(Array.isArray(report.summary.insights)).toBe(true);
    expect(Array.isArray(report.summary.recommendations)).toBe(true);

    const persisted = await ctx.reportRepo.findByOrganization(orgId);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(report.id);
  });

  it('should publish the report-generated event with tenant scope', async () => {
    ctx.events.length = 0;
    await ctx.reportService.generateReport(orgId, '2026-08');

    const event = ctx.events.find((e) => e.type === KnowledgeEventType.REPORT_GENERATED);
    expect(event).toBeDefined();
    expect(event?.tenantId).toBe(orgId);
    expect(event?.payload).toMatchObject({ period: '2026-08' });
  });

  it('should default to the current month period', async () => {
    const report = await ctx.reportService.generateReport(orgId);
    const now = new Date().toISOString().slice(0, 7);
    expect(report.period).toBe(now);
  });

  it('should list reports most recent first', async () => {
    await ctx.reportService.generateReport(orgId, '2026-07');
    await ctx.reportService.generateReport(orgId, '2026-08');

    const reports = await ctx.reportService.listReports(orgId);
    expect(reports).toHaveLength(2);
    expect(reports[0].period).toBe('2026-08');
  });

  it('should isolate reports by tenant', async () => {
    await ctx.reportService.generateReport(orgId, '2026-08');
    await ctx.reportService.generateReport('org-other', '2026-08');

    const reports = await ctx.reportService.listReports(orgId);
    expect(reports).toHaveLength(1);
    expect(reports[0].organizationId).toBe(orgId);
  });
});
