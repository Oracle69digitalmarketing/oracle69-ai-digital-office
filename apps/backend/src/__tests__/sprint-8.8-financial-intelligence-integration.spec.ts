import "reflect-metadata";
import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Global, Module } from "@nestjs/common";
import {
  FinancialIntelligenceModule,
  FinanceController,
  FinancialEventType,
  TransactionType,
  InvoiceStatus,
} from "@oracle69/financial-intelligence";
import { EventBus, EventCatalogService, TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: {
        finTransaction: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          delete: jest.fn(),
        },
        finBudget: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          delete: jest.fn(),
        },
        finInvoice: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          delete: jest.fn(),
        },
        runtimeEventLog: {
          // @ts-ignore
          upsert: jest.fn().mockResolvedValue({}),
        },
        // @ts-ignore
        $connect: jest.fn().mockResolvedValue(undefined),
      } as any,
    },
    {
      provide: "PrismaService",
      useExisting: PrismaClient,
    },
  ],
  exports: [PrismaClient, "PrismaService"],
})
class MockPrismaModule {}

describe("Financial Intelligence backend integration (Sprint 8.8)", () => {
  let moduleRef: TestingModule;
  let controller: FinanceController;
  let eventBus: EventBus;
  let catalog: EventCatalogService;
  let tenantContext: TenantContextService;
  let prisma: any;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MockPrismaModule, FinancialIntelligenceModule],
    }).compile();

    await moduleRef.init();

    controller = moduleRef.get(FinanceController);
    eventBus = moduleRef.get(EventBus);
    catalog = moduleRef.get(EventCatalogService);
    tenantContext = moduleRef.get(TenantContextService);
    prisma = moduleRef.get(PrismaClient);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.finTransaction.create.mockResolvedValue({
      id: "tx-1",
      date: new Date("2026-08-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.finTransaction.findMany.mockResolvedValue([]);
    prisma.finBudget.findMany.mockResolvedValue([]);
    prisma.finInvoice.findMany.mockResolvedValue([]);
  });

  it("should wire the FinanceController REST surface through the backend module", () => {
    expect(controller).toBeDefined();
    expect(eventBus).toBeDefined();
    expect(tenantContext).toBeDefined();
  });

  it("should register financial domain events in the canonical Event Catalog", () => {
    expect(catalog.isCanonical(FinancialEventType.INVOICE_CREATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.INVOICE_PAID)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.INVOICE_CANCELLED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.TRANSACTION_CREATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.BUDGET_CREATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.BUDGET_UPDATED)).toBe(true);
    expect(catalog.isCanonical(FinancialEventType.BUDGET_EXCEEDED)).toBe(true);
  });

  it("should record transactions and compute revenue/expense KPIs through the controller", async () => {
    const income = await controller.recordTransaction("org-1", {
      type: TransactionType.INCOME,
      category: "Sales",
      amount: 500,
      date: "2026-08-01T00:00:00.000Z",
      status: "completed",
    });
    const expense = await controller.recordTransaction("org-1", {
      type: TransactionType.EXPENSE,
      category: "Rent",
      amount: 200,
      date: "2026-08-02T00:00:00.000Z",
      status: "completed",
    });

    expect(income.amount).toBe(500);
    expect(expense.amount).toBe(200);
    expect(prisma.finTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", type: "income" }),
      }),
    );

    prisma.finTransaction.findMany.mockResolvedValue([
      { ...income, date: new Date(income.date), createdAt: new Date(), updatedAt: new Date() },
      { ...expense, date: new Date(expense.date), createdAt: new Date(), updatedAt: new Date() },
    ]);

    const kpis = await controller.getKpis("org-1");
    expect(kpis.totalRevenue).toBe(500);
    expect(kpis.totalExpenses).toBe(200);
    expect(kpis.netProfit).toBe(300);
    expect(kpis.profitMargin).toBe(60);
    expect(kpis.trends).toHaveLength(1);
  });

  it("should manage budgets through the controller", async () => {
    prisma.finBudget.create.mockResolvedValue({
      id: "budget-1",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.finBudget.findUnique.mockResolvedValue({
      id: "budget-1",
      name: "Marketing",
      amount: 1000,
      spent: 0,
      period: "monthly",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T00:00:00.000Z"),
      status: "active",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.finBudget.update.mockResolvedValue({
      id: "budget-1",
      name: "Marketing",
      amount: 2000,
      spent: 0,
      period: "monthly",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T00:00:00.000Z"),
      status: "active",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const budget = await controller.createBudget("org-1", {
      name: "Marketing",
      amount: 1000,
      period: "monthly",
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-31T00:00:00.000Z",
      status: "active",
    });
    expect(budget.organizationId).toBe("org-1");
    expect(prisma.finBudget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", name: "Marketing" }),
      }),
    );

    const updated = await controller.updateBudget("org-1", "budget-1", { amount: 2000 });
    expect(updated.amount).toBe(2000);

    prisma.finBudget.findMany.mockResolvedValue([
      {
        id: "budget-1",
        name: "Marketing",
        amount: 1000,
        spent: 0,
        period: "monthly",
        startDate: new Date("2026-08-01T00:00:00.000Z"),
        endDate: new Date("2026-08-31T00:00:00.000Z"),
        status: "active",
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const summaries = await controller.getBudgets("org-1");
    expect(summaries).toHaveLength(1);
    expect(summaries[0].remaining).toBe(1000);
    expect(summaries[0].utilization).toBe(0);
    expect(summaries[0].exceeded).toBe(false);
  });

  it("should drive the invoice lifecycle through the controller and record income on payment", async () => {
    prisma.finInvoice.create.mockResolvedValue({
      id: "inv-1",
      dueDate: new Date("2026-09-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.finInvoice.update.mockResolvedValue({
      id: "inv-1",
      number: "INV-001",
      amount: 1500,
      dueDate: new Date("2026-09-01T00:00:00.000Z"),
      status: InvoiceStatus.PAID,
      clientId: "client-1",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const invoice = await controller.createInvoice("org-1", {
      number: "INV-001",
      amount: 1500,
      dueDate: "2026-09-01T00:00:00.000Z",
      status: "draft",
      clientId: "client-1",
    });
    expect(invoice.status).toBe("draft");

    prisma.finInvoice.findUnique.mockResolvedValue({
      id: "inv-1",
      number: "INV-001",
      amount: 1500,
      dueDate: new Date("2026-09-01T00:00:00.000Z"),
      status: InvoiceStatus.DRAFT,
      clientId: "client-1",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.sendInvoice("org-1", invoice.id);

    prisma.finInvoice.findUnique.mockResolvedValue({
      id: "inv-1",
      number: "INV-001",
      amount: 1500,
      dueDate: new Date("2026-09-01T00:00:00.000Z"),
      status: InvoiceStatus.SENT,
      clientId: "client-1",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.payInvoice("org-1", invoice.id);

    expect(prisma.finInvoice.update).toHaveBeenCalledTimes(2);
    expect(prisma.finTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.INCOME,
          amount: 1500,
          organizationId: "org-1",
          invoiceId: "inv-1",
        }),
      }),
    );
  });

  it("should enforce strict tenant isolation for finance resources", async () => {
    prisma.finBudget.create.mockResolvedValue({
      id: "budget-owner",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.finBudget.findUnique.mockResolvedValue({
      id: "budget-owner",
      name: "Ops",
      amount: 1000,
      spent: 0,
      period: "monthly",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T00:00:00.000Z"),
      status: "active",
      organizationId: "org-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.finTransaction.findUnique.mockResolvedValue({
      id: "tx-owner",
      organizationId: "org-owner",
      date: new Date("2026-08-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.finInvoice.findUnique.mockResolvedValue({
      id: "inv-owner",
      organizationId: "org-owner",
      dueDate: new Date("2026-09-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const budget = await controller.createBudget("org-owner", {
      name: "Ops",
      amount: 1000,
      period: "monthly",
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-31T00:00:00.000Z",
      status: "active",
    });

    expect(await controller.getBudgets("org-attacker")).toEqual([]);
    await expect(
      controller.updateBudget("org-attacker", budget.id, { amount: 9999 }),
    ).rejects.toThrow("Budget not found");
    expect(await controller.listTransactions("org-attacker")).toEqual([]);
    await expect(controller.payInvoice("org-attacker", "inv-owner")).rejects.toThrow(
      "Invoice not found",
    );
  });

  it("should assess financial health and generate deterministic insights without an AI provider", async () => {
    delete process.env.GOOGLE_AI_API_KEY;

    prisma.finTransaction.findMany.mockResolvedValue([
      {
        id: "tx-inc",
        type: "income",
        category: "Sales",
        amount: 4000,
        date: new Date("2026-08-01T00:00:00.000Z"),
        status: "completed",
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tx-exp",
        type: "expense",
        category: "Ops",
        amount: 1000,
        date: new Date("2026-08-02T00:00:00.000Z"),
        status: "completed",
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const health = await controller.getHealth("org-1");
    expect(health.status).toBe("healthy");
    expect(health.kpis.netProfit).toBe(3000);
    expect(health.reasoning.length).toBeGreaterThan(0);

    const insights = await controller.getInsights("org-1");
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.every((i) => typeof i.content === "string" && i.content.length > 0)).toBe(true);
  });
});
