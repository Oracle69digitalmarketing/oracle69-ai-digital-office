import { describe, it, expect, beforeEach } from '@jest/globals';
import { createFinancialTestModule, FinancialTestContext } from '../testing/test-fixture.js';
import { BudgetPeriod, BudgetStatus, InvoiceStatus, TransactionStatus, TransactionType } from '../types.js';

describe('FinancialIntelligence', () => {
  let ctx: FinancialTestContext;

  beforeEach(() => {
    ctx = createFinancialTestModule();
  });

  it('should calculate profitability KPIs correctly', async () => {
    const orgId = 'tenant-1';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.transactionService.recordTransaction({
        type: TransactionType.INCOME,
        category: 'Sales',
        amount: 1000,
        date: '2026-08-01T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
        organizationId: orgId,
      });
      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Rent',
        amount: 400,
        date: '2026-08-02T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
        organizationId: orgId,
      });

      const kpis = await ctx.kpiService.getKpis(orgId);
      expect(kpis.totalRevenue).toBe(1000);
      expect(kpis.totalExpenses).toBe(400);
      expect(kpis.netProfit).toBe(600);
      expect(kpis.profitMargin).toBe(60);
      expect(kpis.trends).toHaveLength(1);
      expect(kpis.trends[0].period).toBe('2026-08');
      expect(kpis.trends[0].netProfit).toBe(600);
    });
  });

  it('should compute burn rate and runway from recent months', async () => {
    const orgId = 'tenant-runway';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      for (const month of ['2026-06', '2026-07', '2026-08']) {
        await ctx.transactionService.recordTransaction({
          type: TransactionType.INCOME,
          category: 'Sales',
          amount: 3000,
          date: `${month}-01T00:00:00.000Z`,
          status: TransactionStatus.COMPLETED,
          organizationId: orgId,
        });
        await ctx.transactionService.recordTransaction({
          type: TransactionType.EXPENSE,
          category: 'Ops',
          amount: 1000,
          date: `${month}-15T00:00:00.000Z`,
          status: TransactionStatus.COMPLETED,
          organizationId: orgId,
        });
      }

      const kpis = await ctx.kpiService.getKpis(orgId);
      expect(kpis.totalRevenue).toBe(9000);
      expect(kpis.totalExpenses).toBe(3000);
      expect(kpis.netProfit).toBe(6000);
      expect(kpis.burnRate).toBe(1000);
      expect(kpis.runway).toBe(6);
      expect(kpis.trends).toHaveLength(3);
    });
  });

  it('should track budgets, expose utilization and emit exceeded events', async () => {
    const orgId = 'tenant-budget';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const budget = await ctx.budgetService.createBudget({
        name: 'Marketing',
        amount: 500,
        period: BudgetPeriod.MONTHLY,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T00:00:00.000Z',
        status: BudgetStatus.ACTIVE,
      });

      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Ads',
        amount: 600,
        date: '2026-08-05T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
        organizationId: orgId,
        budgetId: budget.id,
      });

      const summaries = await ctx.budgetService.getBudgetSummaries(orgId);
      expect(summaries[0].spent).toBe(600);
      expect(summaries[0].remaining).toBe(0);
      expect(summaries[0].utilization).toBe(100);
      expect(summaries[0].exceeded).toBe(true);

      expect(ctx.events.some((e) => e.type === 'budget.exceeded')).toBe(true);
      const exceeded = ctx.events.find((e) => e.type === 'budget.exceeded');
      expect(exceeded?.tenantId).toBe(orgId);
      expect(exceeded?.payload).toMatchObject({ budgetId: budget.id, amount: 500, spent: 600 });
    });
  });

  it('should drive budget exceeded detection from transaction events', async () => {
    const orgId = 'tenant-event';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const budget = await ctx.budgetService.createBudget({
        name: 'Development',
        amount: 100,
        period: BudgetPeriod.MONTHLY,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T00:00:00.000Z',
        status: BudgetStatus.ACTIVE,
      });

      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Hosting',
        amount: 250,
        date: '2026-08-06T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
        organizationId: orgId,
        budgetId: budget.id,
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      const refreshed = await ctx.budgetService.findById(budget.id, orgId);
      expect(refreshed?.spent).toBe(250);
      expect(ctx.events.some((e) => e.type === 'budget.exceeded')).toBe(true);
    });
  });

  it('should manage the invoice lifecycle and record income on payment', async () => {
    const orgId = 'tenant-invoice';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const invoice = await ctx.invoiceService.createInvoice({
        number: 'INV-001',
        amount: 1500,
        dueDate: '2026-08-20T00:00:00.000Z',
        status: InvoiceStatus.DRAFT,
        clientId: 'client-1',
      });
      expect(invoice.status).toBe(InvoiceStatus.DRAFT);

      await ctx.invoiceService.sendInvoice(invoice.id);
      const sent = await ctx.invoiceService.findById(invoice.id, orgId);
      expect(sent?.status).toBe(InvoiceStatus.SENT);

      await ctx.invoiceService.markAsPaid(invoice.id);
      const paid = await ctx.invoiceService.findById(invoice.id, orgId);
      expect(paid?.status).toBe(InvoiceStatus.PAID);

      const kpis = await ctx.kpiService.getKpis(orgId);
      expect(kpis.totalRevenue).toBe(1500);

      const transactions = await ctx.transactionService.listTransactions(orgId, { type: TransactionType.INCOME });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].invoiceId).toBe(invoice.id);

      expect(ctx.events.some((e) => e.type === 'invoice.created')).toBe(true);
      expect(ctx.events.some((e) => e.type === 'invoice.paid')).toBe(true);
      expect(ctx.events.some((e) => e.type === 'transaction.created')).toBe(true);
      const paidEvent = ctx.events.find((e) => e.type === 'invoice.paid');
      expect(paidEvent?.tenantId).toBe(orgId);
    });
  });

  it('should isolate all financial data per tenant', async () => {
    const orgA = 'tenant-a';
    const orgB = 'tenant-b';

    const budgetA = await ctx.tenantContext.runAsync({ tenantId: orgA }, async () =>
      ctx.budgetService.createBudget({
        name: 'Marketing A',
        amount: 1000,
        period: BudgetPeriod.MONTHLY,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T00:00:00.000Z',
        status: BudgetStatus.ACTIVE,
      }),
    );

    const txB = await ctx.tenantContext.runAsync({ tenantId: orgB }, async () =>
      ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Tools',
        amount: 50,
        date: '2026-08-02T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      }),
    );

    const invoiceB = await ctx.tenantContext.runAsync({ tenantId: orgB }, async () =>
      ctx.invoiceService.createInvoice({
        number: 'INV-B-1',
        amount: 200,
        dueDate: '2026-09-01T00:00:00.000Z',
        status: InvoiceStatus.DRAFT,
        clientId: 'client-b',
      }),
    );

    const kpisA = await ctx.kpiService.getKpis(orgA);
    const kpisB = await ctx.kpiService.getKpis(orgB);
    expect(kpisA.totalRevenue).toBe(0);
    expect(kpisA.totalExpenses).toBe(0);
    expect(kpisB.totalExpenses).toBe(50);

    expect(await ctx.budgetService.findById(budgetA.id, orgB)).toBeNull();
    expect(await ctx.transactionService.findById(txB.id, orgA)).toBeNull();
    expect(await ctx.invoiceService.findById(invoiceB.id, orgA)).toBeNull();

    expect(await ctx.budgetService.getBudgets(orgA)).toHaveLength(1);
    expect(await ctx.budgetService.getBudgets(orgB)).toHaveLength(0);
  });

  it('should refuse to update or cancel records owned by another tenant', async () => {
    const orgA = 'tenant-owner';
    const orgB = 'tenant-attacker';

    const budgetA = await ctx.tenantContext.runAsync({ tenantId: orgA }, async () =>
      ctx.budgetService.createBudget({
        name: 'Ops',
        amount: 1000,
        period: BudgetPeriod.MONTHLY,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T00:00:00.000Z',
        status: BudgetStatus.ACTIVE,
      }),
    );

    const invoiceA = await ctx.tenantContext.runAsync({ tenantId: orgA }, async () =>
      ctx.invoiceService.createInvoice({
        number: 'INV-OWNER-1',
        amount: 500,
        dueDate: '2026-09-01T00:00:00.000Z',
        status: InvoiceStatus.SENT,
        clientId: 'client-a',
      }),
    );

    await expect(ctx.budgetService.updateBudget(budgetA.id, { amount: 9999, organizationId: orgB })).rejects.toThrow(
      'Budget not found',
    );
    await expect(ctx.invoiceService.markAsPaid(invoiceA.id, orgB)).rejects.toThrow('Invoice not found');
    await expect(ctx.invoiceService.cancelInvoice(invoiceA.id, orgB)).rejects.toThrow('Invoice not found');
  });
});
