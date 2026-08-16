import { Inject, Injectable } from "@nestjs/common";
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from "../repositories/transaction.repository.js";
import { FinancialKpis, TransactionStatus, TransactionType } from "../types.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class FinancialKpiService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepo: TransactionRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getKpis(organizationId?: string): Promise<FinancialKpis> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const transactions = await this.transactionRepo.findByOrganization(tenantId, {
      status: TransactionStatus.COMPLETED,
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    const monthlyTrends = new Map<string, { revenue: number; expenses: number }>();

    for (const t of transactions) {
      const amount = t.amount;
      const month = t.date.substring(0, 7); // YYYY-MM

      if (!monthlyTrends.has(month)) {
        monthlyTrends.set(month, { revenue: 0, expenses: 0 });
      }

      const trend = monthlyTrends.get(month)!;

      if (t.type === TransactionType.INCOME) {
        totalRevenue += amount;
        trend.revenue += amount;
      } else {
        totalExpenses += amount;
        trend.expenses += amount;
      }
    }

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Simple burn rate calculation (average expenses over the last 3 months)
    const sortedMonths = Array.from(monthlyTrends.keys()).sort().reverse();
    const last3Months = sortedMonths.slice(0, 3);
    const recentExpenses = last3Months.reduce((sum, m) => sum + monthlyTrends.get(m)!.expenses, 0);
    const burnRate = last3Months.length > 0 ? recentExpenses / last3Months.length : 0;

    const trends = Array.from(monthlyTrends.entries())
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        expenses: data.expenses,
        netProfit: data.revenue - data.expenses,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Runway estimate in months: available surplus divided by the monthly burn rate.
    const runway =
      burnRate > 0 && netProfit > 0 ? Math.round((netProfit / burnRate) * 10) / 10 : undefined;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      burnRate,
      runway,
      trends,
    };
  }
}
