import { describe, it, expect, beforeEach } from '@jest/globals';
import { createFinancialTestModule, FinancialTestContext } from '../testing/test-fixture.js';
import { BudgetPeriod, BudgetStatus, InvoiceStatus, TransactionStatus, TransactionType } from '../types.js';

describe('Financial health & AI insights', () => {
  let ctx: FinancialTestContext;

  beforeEach(() => {
    ctx = createFinancialTestModule();
  });

  it('should assess healthy financial health', async () => {
    const orgId = 'org-health-1';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.transactionService.recordTransaction({
        type: TransactionType.INCOME,
        category: 'Sales',
        amount: 10000,
        date: '2026-08-01T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      });
      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Ops',
        amount: 2000,
        date: '2026-08-02T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      });
    });

    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe('healthy');
    expect(health.score).toBeGreaterThanOrEqual(80);
    expect(health.kpis.netProfit).toBe(8000);
    expect(health.reasoning.length).toBeGreaterThan(0);
  });

  it('should flag critical health when losing money and exceeding budgets', async () => {
    const orgId = 'org-health-2';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.transactionService.recordTransaction({
        type: TransactionType.INCOME,
        category: 'Sales',
        amount: 500,
        date: '2026-08-01T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      });
      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Ops',
        amount: 2000,
        date: '2026-08-02T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      });

      const budget = await ctx.budgetService.createBudget({
        name: 'Marketing',
        amount: 100,
        period: BudgetPeriod.MONTHLY,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T00:00:00.000Z',
        status: BudgetStatus.ACTIVE,
      });

      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Ads',
        amount: 300,
        date: '2026-08-05T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
        budgetId: budget.id,
      });

      await ctx.invoiceService.createInvoice({
        number: 'INV-OVERDUE-1',
        amount: 1000,
        dueDate: '2026-07-01T00:00:00.000Z',
        status: InvoiceStatus.OVERDUE,
        clientId: 'client-x',
      });
    });

    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe('critical');
    expect(health.overdueInvoices).toBe(1);
    expect(health.outstandingInvoices).toBe(1);
    expect(health.budgetSummaries[0].exceeded).toBe(true);
  });

  it('should fall back to deterministic insights without an AI provider', async () => {
    const orgId = 'org-ai-1';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.transactionService.recordTransaction({
        type: TransactionType.INCOME,
        category: 'Sales',
        amount: 1000,
        date: '2026-08-01T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      });
      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Ops',
        amount: 1600,
        date: '2026-08-02T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      });
    });

    const health = await ctx.healthService.assess(orgId);
    const insights = await ctx.aiService.generateInsights(health);

    expect(insights.length).toBeGreaterThanOrEqual(3);
    const alert = insights.find((i) => i.type === 'alert');
    expect(alert?.title).toBe('Negative Profitability');
    expect(alert?.priority).toBe('high');
    expect(insights.every((i) => typeof i.content === 'string' && i.content.length > 0)).toBe(true);
  });

  it('should use AI-provided insights when a provider is available', async () => {
    const orgId = 'org-ai-2';
    const originalProvider = (ctx.aiService as any).modelProvider;
    (ctx.aiService as any).modelProvider = {
      name: 'mock',
      async generate(): Promise<any> {
        return { content: '[]' };
      },
      async analyze(): Promise<any> {
        return {
          content: JSON.stringify([
            {
              type: 'recommendation',
              title: 'Cut marketing spend',
              content: 'Reduce paid channels to restore margin.',
              priority: 'high',
              impact: 'Cost Control',
            },
          ]),
        };
      },
    };
    process.env.GOOGLE_AI_API_KEY = 'test-key';
    try {
      const health = await ctx.healthService.assess(orgId);
      const insights = await ctx.aiService.generateInsights(health);
      expect(insights).toHaveLength(1);
      expect(insights[0].title).toBe('Cut marketing spend');
      expect(insights[0].priority).toBe('high');
    } finally {
      delete process.env.GOOGLE_AI_API_KEY;
      (ctx.aiService as any).modelProvider = originalProvider;
    }
  });
});
