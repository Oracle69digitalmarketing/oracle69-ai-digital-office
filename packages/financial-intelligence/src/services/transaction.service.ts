import { Inject, Injectable } from "@nestjs/common";
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from "../repositories/transaction.repository.js";
import { FinTransaction, TransactionStatus, TransactionType } from "../types.js";
import { EventBus, TenantContextService } from "@oracle69/runtime";
import { FinancialEventType } from "../events/financial.events.js";

const EVENT_SOURCE = "financial-intelligence";

@Injectable()
export class TransactionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepo: TransactionRepository,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async recordTransaction(
    transaction: Omit<FinTransaction, "id" | "createdAt" | "updatedAt" | "organizationId"> & {
      organizationId?: string;
    },
  ): Promise<FinTransaction> {
    const tenantId = this.tenantContext.resolveTenantId(transaction.organizationId);
    const created = await this.transactionRepo.create({ ...transaction, organizationId: tenantId });
    await this.eventBus.publish(FinancialEventType.TRANSACTION_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async listTransactions(
    organizationId?: string,
    options?: { type?: TransactionType; status?: TransactionStatus },
  ): Promise<FinTransaction[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.transactionRepo.findByOrganization(tenantId, options);
  }

  async findById(id: string, organizationId?: string): Promise<FinTransaction | null> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.transactionRepo.findById(id, tenantId);
  }

  async cancelTransaction(id: string, organizationId?: string): Promise<FinTransaction> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const existing = await this.transactionRepo.findById(id, tenantId);
    if (!existing) throw new Error("Transaction not found");
    if (existing.status === TransactionStatus.CANCELLED) return existing;
    return this.transactionRepo.update(id, { status: TransactionStatus.CANCELLED });
  }
}
