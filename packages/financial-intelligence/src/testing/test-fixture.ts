import { EventBus, EventCatalogService, TenantContextService } from '@oracle69/runtime';
import { FinancialKpiService } from '../services/financial-kpi.service.js';
import { FinancialHealthService } from '../services/financial-health.service.js';
import { BudgetService } from '../services/budget.service.js';
import { InvoiceService } from '../services/invoice.service.js';
import { TransactionService } from '../services/transaction.service.js';
import { FinancialAiService } from '../services/financial-ai.service.js';
import { TransactionRepository, TRANSACTION_REPOSITORY, InMemoryTransactionRepository } from '../repositories/transaction.repository.js';
import { BudgetRepository, BUDGET_REPOSITORY, InMemoryBudgetRepository } from '../repositories/budget.repository.js';
import { InvoiceRepository, INVOICE_REPOSITORY, InMemoryInvoiceRepository } from '../repositories/invoice.repository.js';

export interface FinancialTestContext {
  kpiService: FinancialKpiService;
  healthService: FinancialHealthService;
  budgetService: BudgetService;
  invoiceService: InvoiceService;
  transactionService: TransactionService;
  aiService: FinancialAiService;
  eventBus: EventBus;
  catalog: EventCatalogService;
  tenantContext: TenantContextService;
  events: Array<{ type: string; payload: unknown; tenantId?: string }>;
  close(): void;
}

/**
 * Builds the Financial Intelligence services wired with the canonical (real)
 * EventBus, EventCatalogService and TenantContextService plus in-memory
 * repositories. Every published event is captured in `events` for assertion.
 */
export function createFinancialTestModule(): FinancialTestContext {
  const events: Array<{ type: string; payload: unknown; tenantId?: string }> = [];
  const catalog = new EventCatalogService();
  const tenantContext = new TenantContextService();
  const eventBus = new EventBus(catalog, tenantContext);
  eventBus.allEvents().subscribe((event) => {
    events.push({ type: event.type, payload: event.payload, tenantId: event.tenantId });
  });

  const transactionRepo: TransactionRepository = new InMemoryTransactionRepository();
  const budgetRepo: BudgetRepository = new InMemoryBudgetRepository();
  const invoiceRepo: InvoiceRepository = new InMemoryInvoiceRepository();

  const kpiService = new FinancialKpiService(transactionRepo, tenantContext);
  const transactionService = new TransactionService(transactionRepo, eventBus, tenantContext);
  const budgetService = new BudgetService(budgetRepo, transactionRepo, eventBus, tenantContext);
  const invoiceService = new InvoiceService(invoiceRepo, transactionService, eventBus, tenantContext);
  const healthService = new FinancialHealthService(kpiService, budgetService, invoiceService);
  const aiService = new FinancialAiService(undefined as never);

  budgetService.onModuleInit();

  return {
    kpiService,
    healthService,
    budgetService,
    invoiceService,
    transactionService,
    aiService,
    eventBus,
    catalog,
    tenantContext,
    events,
    close() {
      budgetService.onModuleDestroy();
      eventBus.complete();
    },
  };
}

export { TRANSACTION_REPOSITORY, BUDGET_REPOSITORY, INVOICE_REPOSITORY };
