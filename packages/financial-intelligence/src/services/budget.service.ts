import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BUDGET_REPOSITORY, type BudgetRepository } from '../repositories/budget.repository.js';
import { TRANSACTION_REPOSITORY, type TransactionRepository } from '../repositories/transaction.repository.js';
import { BudgetSummary, FinBudget, BudgetStatus, TransactionType, TransactionStatus } from '../types.js';
import { EventBus, TenantContextService } from '@oracle69/runtime';
import { FinancialEventType } from '../events/financial.events.js';

const EVENT_SOURCE = 'financial-intelligence';

@Injectable()
export class BudgetService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepo: BudgetRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepo: TransactionRepository,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.eventBus.subscribe(FinancialEventType.TRANSACTION_CREATED, (event) => {
      const payload = (event.payload ?? {}) as { budgetId?: string; type?: string };
      if (payload.budgetId && payload.type === TransactionType.EXPENSE) {
        void this.refreshSpent(payload.budgetId, event.tenantId).catch((error) =>
          this.logger.warn(`Failed to refresh budget spent for ${payload.budgetId}: ${error}`),
        );
      }
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private subscription?: { unsubscribe(): void };

  async createBudget(budget: Omit<FinBudget, 'id' | 'createdAt' | 'updatedAt' | 'spent' | 'organizationId'> & { organizationId?: string }): Promise<FinBudget> {
    const tenantId = this.tenantContext.resolveTenantId(budget.organizationId);
    const created = await this.budgetRepo.create({ ...budget, organizationId: tenantId, spent: 0 });
    await this.eventBus.publish(FinancialEventType.BUDGET_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async updateBudget(id: string, data: Partial<FinBudget> & { organizationId?: string }): Promise<FinBudget> {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const existing = await this.budgetRepo.findById(id, tenantId);
    if (!existing) throw new Error('Budget not found');
    const updated = await this.budgetRepo.update(id, data);
    await this.eventBus.publish(FinancialEventType.BUDGET_UPDATED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async getBudgets(organizationId?: string, status?: BudgetStatus): Promise<FinBudget[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const budgets = await this.budgetRepo.findByOrganization(tenantId, status);
    return Promise.all(budgets.map(async (b) => this.refreshSpent(b.id, tenantId)));
  }

  /** Returns budgets enriched with remaining amount and utilization percentage. */
  async getBudgetSummaries(organizationId?: string, status?: BudgetStatus): Promise<BudgetSummary[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const budgets = await this.getBudgets(tenantId, status);
    return budgets.map((budget) => this.toSummary(budget));
  }

  async findById(id: string, organizationId?: string): Promise<FinBudget | null> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.budgetRepo.findById(id, tenantId);
  }

  /**
   * Recomputes the spent amount of a budget from its completed expense
   * transactions and publishes `budget.exceeded` when the threshold is crossed.
   */
  async refreshSpent(budgetId: string, organizationId?: string): Promise<FinBudget> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const budget = await this.budgetRepo.findById(budgetId, tenantId);
    if (!budget) throw new Error('Budget not found');

    const transactions = await this.transactionRepo.findByOrganization(tenantId, {
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
    });

    const spent = transactions
      .filter((t) => t.budgetId === budgetId)
      .reduce((sum, t) => sum + t.amount, 0);

    if (spent === budget.spent) return budget;

    const updated = await this.budgetRepo.update(budgetId, { spent });

    if (spent > budget.amount) {
      await this.eventBus.publish(
        FinancialEventType.BUDGET_EXCEEDED,
        { budgetId, name: budget.name, amount: budget.amount, spent, utilization: this.utilization(spent, budget.amount) },
        { tenantId, source: EVENT_SOURCE },
      );
    }
    return updated;
  }

  private toSummary(budget: FinBudget): BudgetSummary {
    const utilization = this.utilization(budget.spent, budget.amount);
    return {
      ...budget,
      remaining: Math.max(0, budget.amount - budget.spent),
      utilization,
      exceeded: budget.spent > budget.amount,
    };
  }

  private utilization(spent: number, amount: number): number {
    if (amount <= 0) return spent > 0 ? 100 : 0;
    return Math.min(100, Math.round((spent / amount) * 100));
  }
}
