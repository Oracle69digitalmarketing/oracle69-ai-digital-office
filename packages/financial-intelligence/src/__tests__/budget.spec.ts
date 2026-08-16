import { describe, it, expect, beforeEach } from "@jest/globals";
import { createFinancialTestModule, FinancialTestContext } from "../testing/test-fixture.js";
import { BudgetPeriod, BudgetStatus, TransactionStatus, TransactionType } from "../types.js";

describe("Budget management", () => {
  let ctx: FinancialTestContext;

  beforeEach(() => {
    ctx = createFinancialTestModule();
  });

  async function createBudget(orgId: string, name: string, amount: number, spent = 0) {
    return ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.budgetService.createBudget({
        name,
        amount,
        period: BudgetPeriod.MONTHLY,
        startDate: "2026-08-01T00:00:00.000Z",
        endDate: "2026-08-31T00:00:00.000Z",
        status: BudgetStatus.ACTIVE,
      }),
    );
  }

  it("should create a budget with zero spent and emit budget.created", async () => {
    const orgId = "org-budget-1";
    const budget = await createBudget(orgId, "Marketing", 5000);

    expect(budget.spent).toBe(0);
    expect(budget.organizationId).toBe(orgId);
    const created = ctx.events.find((e) => e.type === "budget.created");
    expect(created?.tenantId).toBe(orgId);
    expect(created?.payload).toMatchObject({ id: budget.id, amount: 5000 });
  });

  it("should compute utilization and remaining amounts", async () => {
    const orgId = "org-budget-2";
    const budget = await createBudget(orgId, "Development", 10000);

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: "Hosting",
        amount: 2500,
        date: "2026-08-10T00:00:00.000Z",
        status: TransactionStatus.COMPLETED,
        budgetId: budget.id,
      }),
    );

    const summaries = await ctx.budgetService.getBudgetSummaries(orgId);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].spent).toBe(2500);
    expect(summaries[0].remaining).toBe(7500);
    expect(summaries[0].utilization).toBe(25);
    expect(summaries[0].exceeded).toBe(false);
  });

  it("should update a budget and emit budget.updated", async () => {
    const orgId = "org-budget-3";
    const budget = await createBudget(orgId, "Sales", 2000);

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.budgetService.updateBudget(budget.id, { amount: 4000 }),
    );

    const updated = await ctx.budgetService.findById(budget.id, orgId);
    expect(updated?.amount).toBe(4000);

    const updatedEvent = ctx.events.find((e) => e.type === "budget.updated");
    expect(updatedEvent).toBeDefined();
    expect(updatedEvent?.tenantId).toBe(orgId);
  });

  it("should not double publish budget.exceeded while spent is unchanged", async () => {
    const orgId = "org-budget-4";
    const budget = await createBudget(orgId, "Ops", 500);

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: "Rent",
        amount: 700,
        date: "2026-08-12T00:00:00.000Z",
        status: TransactionStatus.COMPLETED,
        budgetId: budget.id,
      }),
    );

    await ctx.budgetService.getBudgetSummaries(orgId);
    await ctx.budgetService.getBudgetSummaries(orgId);

    const exceededCount = ctx.events.filter((e) => e.type === "budget.exceeded").length;
    expect(exceededCount).toBe(1);
  });

  it("should filter budgets by status", async () => {
    const orgId = "org-budget-5";
    await createBudget(orgId, "Active A", 1000);
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.budgetService.createBudget({
        name: "Inactive B",
        amount: 500,
        period: BudgetPeriod.QUARTERLY,
        startDate: "2026-08-01T00:00:00.000Z",
        endDate: "2026-10-31T00:00:00.000Z",
        status: BudgetStatus.INACTIVE,
      }),
    );

    const active = await ctx.budgetService.getBudgets(orgId, BudgetStatus.ACTIVE);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("Active A");
  });

  it("should only count completed expense transactions against spent", async () => {
    const orgId = "org-budget-6";
    const budget = await createBudget(orgId, "Research", 1000);

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: "Data",
        amount: 800,
        date: "2026-08-13T00:00:00.000Z",
        status: TransactionStatus.PENDING,
        budgetId: budget.id,
      }),
    );

    const summaries = await ctx.budgetService.getBudgetSummaries(orgId);
    expect(summaries[0].spent).toBe(0);
  });
});
