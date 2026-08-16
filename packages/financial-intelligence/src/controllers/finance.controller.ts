import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { FinancialKpiService } from "../services/financial-kpi.service.js";
import { FinancialHealthService } from "../services/financial-health.service.js";
import { FinancialAiService } from "../services/financial-ai.service.js";
import { TransactionService } from "../services/transaction.service.js";
import { BudgetService } from "../services/budget.service.js";
import { InvoiceService } from "../services/invoice.service.js";
import { BudgetStatus, InvoiceStatus, TransactionStatus, TransactionType } from "../types.js";
import { TenantContextService } from "@oracle69/runtime";

/**
 * Tenant-scoped REST surface for Financial Intelligence.
 *
 * Every route is executed inside a {@link TenantContextService} scope resolved
 * from the `organizationId` path segment, so the canonical services and the
 * EventBus inherit the tenant without any cross-tenant reads or writes.
 */
@Controller("finance")
export class FinanceController {
  constructor(
    private readonly kpiService: FinancialKpiService,
    private readonly healthService: FinancialHealthService,
    private readonly aiService: FinancialAiService,
    private readonly transactionService: TransactionService,
    private readonly budgetService: BudgetService,
    private readonly invoiceService: InvoiceService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(":organizationId/kpis")
  getKpis(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.kpiService.getKpis(organizationId),
    );
  }

  @Get(":organizationId/health")
  getHealth(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.healthService.assess(organizationId),
    );
  }

  @Get(":organizationId/insights")
  async getInsights(@Param("organizationId") organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, async () => {
      const health = await this.healthService.assess(organizationId);
      return this.aiService.generateInsights(health);
    });
  }

  @Get(":organizationId/transactions")
  listTransactions(
    @Param("organizationId") organizationId: string,
    @Query("type") type?: TransactionType,
    @Query("status") status?: TransactionStatus,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.transactionService.listTransactions(organizationId, { type, status }),
    );
  }

  @Post(":organizationId/transactions")
  recordTransaction(@Param("organizationId") organizationId: string, @Body() body: any) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.transactionService.recordTransaction({ ...body, organizationId }),
    );
  }

  @Get(":organizationId/budgets")
  getBudgets(
    @Param("organizationId") organizationId: string,
    @Query("status") status?: BudgetStatus,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.budgetService.getBudgetSummaries(organizationId, status),
    );
  }

  @Post(":organizationId/budgets")
  createBudget(@Param("organizationId") organizationId: string, @Body() body: any) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.budgetService.createBudget({ ...body, organizationId }),
    );
  }

  @Patch(":organizationId/budgets/:id")
  updateBudget(
    @Param("organizationId") organizationId: string,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.budgetService.updateBudget(id, { ...body, organizationId }),
    );
  }

  @Get(":organizationId/invoices")
  getInvoices(
    @Param("organizationId") organizationId: string,
    @Query("status") status?: InvoiceStatus,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.invoiceService.getInvoices(organizationId, status),
    );
  }

  @Post(":organizationId/invoices")
  createInvoice(@Param("organizationId") organizationId: string, @Body() body: any) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.invoiceService.createInvoice({ ...body, organizationId }),
    );
  }

  @Post(":organizationId/invoices/:id/send")
  sendInvoice(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.invoiceService.sendInvoice(id, organizationId),
    );
  }

  @Post(":organizationId/invoices/:id/pay")
  payInvoice(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.invoiceService.markAsPaid(id, organizationId),
    );
  }

  @Post(":organizationId/invoices/:id/cancel")
  cancelInvoice(@Param("organizationId") organizationId: string, @Param("id") id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.invoiceService.cancelInvoice(id, organizationId),
    );
  }
}
