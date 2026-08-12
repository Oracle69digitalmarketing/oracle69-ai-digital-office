import { describe, it, expect, beforeEach } from "@jest/globals";
import { EventCatalogService } from "@oracle69/runtime";
import { FinancialIntelligenceModule } from "../financial-intelligence.module.js";
import { FinancialEventType } from "../events/financial.events.js";
import { createFinancialTestModule, FinancialTestContext } from "../testing/test-fixture.js";
import { BudgetPeriod, BudgetStatus, InvoiceStatus, TransactionStatus, TransactionType } from "../types.js";

describe("Financial Intelligence module (Event Bus integration)", () => {
  let ctx: FinancialTestContext;

  beforeEach(() => {
    ctx = createFinancialTestModule();
  });

  it("should register financial domain events in the canonical Event Catalog", () => {
    const catalog = new EventCatalogService();
    new FinancialIntelligenceModule(catalog);

    expect(catalog.isCanonical(FinancialEventType.INVOICE_CREATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.INVOICE_PAID)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.INVOICE_CANCELLED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.TRANSACTION_CREATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.BUDGET_CREATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.BUDGET_UPDATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.BUDGET_EXCEEDED)).toBe(true);

    const entry = catalog.entry(FinancialEventType.BUDGET_EXCEEDED);
    expect(entry?.description).toContain("exceeded");
    expect(catalog.entry(FinancialEventType.INVOICE_PAID)?.category).toBe("executive");
  });

  it("should publish canonical financial events through the shared EventBus", async () => {
    const orgId = "org-module-1";
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const budget = await ctx.budgetService.createBudget({
        name: "Marketing",
        amount: 1000,
        period: BudgetPeriod.MONTHLY,
        startDate: "2026-08-01T00:00:00.000Z",
        endDate: "2026-08-31T00:00:00.000Z",
        status: BudgetStatus.ACTIVE,
      });

      await ctx.transactionService.recordTransaction({
        type: TransactionType.EXPENSE,
        category: "Ads",
        amount: 1500,
        date: "2026-08-05T00:00:00.000Z",
        status: TransactionStatus.COMPLETED,
        budgetId: budget.id,
      });

      const invoice = await ctx.invoiceService.createInvoice({
        number: "INV-MODULE-1",
        amount: 800,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.DRAFT,
        clientId: "client-x",
      });
      await ctx.invoiceService.markAsPaid(invoice.id);
    });

    const published = ctx.events.filter((e) => e.tenantId === orgId);
    const types = published.map((e) => e.type);
    expect(types).toContain(FinancialEventType.BUDGET_CREATED);
    expect(types).toContain(FinancialEventType.TRANSACTION_CREATED);
    expect(types).toContain(FinancialEventType.BUDGET_EXCEEDED);
    expect(types).toContain(FinancialEventType.INVOICE_CREATED);
    expect(types).toContain(FinancialEventType.INVOICE_PAID);

    const created = published.find((e) => e.type === FinancialEventType.BUDGET_CREATED);
    expect(created).toBeDefined();
    expect(created.payload).toMatchObject({ name: "Marketing" });
  });
});
