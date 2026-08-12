import { describe, it, expect, beforeEach } from '@jest/globals';
import { createFinancialTestModule, FinancialTestContext } from '../testing/test-fixture.js';
import { TransactionStatus, TransactionType } from '../types.js';

describe('Transaction service', () => {
  let ctx: FinancialTestContext;

  beforeEach(() => {
    ctx = createFinancialTestModule();
  });

  it('should record a transaction and emit transaction.created with tenant scope', async () => {
    const orgId = 'org-tx-1';
    const transaction = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.transactionService.recordTransaction({
        type: TransactionType.INCOME,
        category: 'Consulting',
        amount: 750,
        date: '2026-08-15T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      }),
    );

    expect(transaction.organizationId).toBe(orgId);
    const event = ctx.events.find((e) => e.type === 'transaction.created');
    expect(event).toBeDefined();
    expect(event?.tenantId).toBe(orgId);
    expect(event?.payload).toMatchObject({ id: transaction.id, amount: 750 });
  });

  it('should list and filter transactions by type and status', async () => {
    const orgId = 'org-tx-2';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.transactionService.recordTransaction({
        type: TransactionType.INCOME,
        category: 'Sales',
        amount: 100,
        date: '2026-08-01T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      });
      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Tools',
        amount: 30,
        date: '2026-08-02T00:00:00.000Z',
        status: TransactionStatus.PENDING,
      });
    });

    const income = await ctx.transactionService.listTransactions(orgId, { type: TransactionType.INCOME });
    expect(income).toHaveLength(1);
    expect(income[0].category).toBe('Sales');

    const pending = await ctx.transactionService.listTransactions(orgId, { status: TransactionStatus.PENDING });
    expect(pending).toHaveLength(1);
  });

  it('should cancel a transaction owned by the tenant', async () => {
    const orgId = 'org-tx-3';
    const transaction = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Travel',
        amount: 120,
        date: '2026-08-03T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      }),
    );

    const cancelled = await ctx.transactionService.cancelTransaction(transaction.id, orgId);
    expect(cancelled.status).toBe(TransactionStatus.CANCELLED);
  });

  it('should not cancel a transaction owned by another tenant', async () => {
    const orgA = 'org-tx-owner';
    const orgB = 'org-tx-attacker';
    const transaction = await ctx.tenantContext.runAsync({ tenantId: orgA }, () =>
      ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: 'Travel',
        amount: 120,
        date: '2026-08-03T00:00:00.000Z',
        status: TransactionStatus.COMPLETED,
      }),
    );

    await expect(ctx.transactionService.cancelTransaction(transaction.id, orgB)).rejects.toThrow('Transaction not found');
    await expect(ctx.transactionService.findById(transaction.id, orgB)).resolves.toBeNull();
  });
});
