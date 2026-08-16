import { Module, Provider } from "@nestjs/common";
import { FinancialKpiService } from "./services/financial-kpi.service.js";
import { FinancialHealthService } from "./services/financial-health.service.js";
import { BudgetService } from "./services/budget.service.js";
import { InvoiceService } from "./services/invoice.service.js";
import { TransactionService } from "./services/transaction.service.js";
import { FinancialAiService } from "./services/financial-ai.service.js";
import {
  TRANSACTION_REPOSITORY,
  PrismaTransactionRepository,
} from "./repositories/transaction.repository.js";
import { BUDGET_REPOSITORY, PrismaBudgetRepository } from "./repositories/budget.repository.js";
import { INVOICE_REPOSITORY, PrismaInvoiceRepository } from "./repositories/invoice.repository.js";
import { FinanceController } from "./controllers/finance.controller.js";
import { RuntimeModule, EventCatalogService, EventCategory } from "@oracle69/runtime";
import { GeminiModelProvider } from "@oracle69/sales-intelligence";
import { FinancialEventType } from "./events/financial.events.js";

const Repositories: Provider[] = [
  {
    provide: TRANSACTION_REPOSITORY,
    useClass: PrismaTransactionRepository,
  },
  {
    provide: BUDGET_REPOSITORY,
    useClass: PrismaBudgetRepository,
  },
  {
    provide: INVOICE_REPOSITORY,
    useClass: PrismaInvoiceRepository,
  },
];

@Module({
  imports: [RuntimeModule],
  controllers: [FinanceController],
  providers: [
    ...Repositories,
    FinancialKpiService,
    FinancialHealthService,
    BudgetService,
    InvoiceService,
    TransactionService,
    FinancialAiService,
    {
      provide: "AiModelProvider",
      useFactory: () => new GeminiModelProvider(process.env.GOOGLE_AI_API_KEY || ""),
    },
  ],
  exports: [
    FinancialKpiService,
    FinancialHealthService,
    BudgetService,
    InvoiceService,
    TransactionService,
    FinancialAiService,
    ...Repositories,
  ],
})
export class FinancialIntelligenceModule {
  constructor(private readonly eventCatalog: EventCatalogService) {
    this.eventCatalog.registerDomainType(
      FinancialEventType.INVOICE_CREATED,
      "A new invoice was created.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      FinancialEventType.INVOICE_PAID,
      "An invoice was marked as paid.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      FinancialEventType.INVOICE_CANCELLED,
      "An invoice was cancelled.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      FinancialEventType.TRANSACTION_CREATED,
      "A financial transaction was recorded.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      FinancialEventType.BUDGET_CREATED,
      "A new departmental budget was established.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      FinancialEventType.BUDGET_UPDATED,
      "A departmental budget was updated.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      FinancialEventType.BUDGET_EXCEEDED,
      "A departmental budget limit was exceeded.",
      EventCategory.EXECUTIVE,
    );
  }
}
