import { Injectable } from '@nestjs/common';
import { FinancialKpiService } from './financial-kpi.service.js';
import { BudgetService } from './budget.service.js';
import { InvoiceService } from './invoice.service.js';
import { FinancialHealth, InvoiceStatus } from '../types.js';

const HEALTH_FACTORS: Record<'healthy' | 'at_risk' | 'critical', number> = {
  healthy: 80,
  at_risk: 55,
  critical: 30,
};

/**
 * Assembles a tenant-scoped financial health snapshot from the persisted KPIs,
 * departmental budgets and invoice exposure. The deterministic score is derived
 * from profitability, budget utilization and outstanding receivables, and is
 * consumed by the AI insight service for health analysis and forecasting.
 */
@Injectable()
export class FinancialHealthService {
  constructor(
    private readonly kpiService: FinancialKpiService,
    private readonly budgetService: BudgetService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async assess(organizationId?: string): Promise<FinancialHealth> {
    const [kpis, budgetSummaries, invoices] = await Promise.all([
      this.kpiService.getKpis(organizationId),
      this.budgetService.getBudgetSummaries(organizationId),
      this.invoiceService.getInvoices(organizationId),
    ]);

    const outstandingInvoices = invoices.filter((i) => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.OVERDUE).length;
    const overdueInvoices = invoices.filter((i) => i.status === InvoiceStatus.OVERDUE).length;
    const exceededBudgets = budgetSummaries.filter((b) => b.exceeded).length;

    const reasoning: string[] = [];
    let score = HEALTH_FACTORS.healthy;

    if (kpis.netProfit < 0) {
      score -= 35;
      reasoning.push('Net profit is negative; expenses exceed revenue.');
    } else {
      reasoning.push(`Net profit is $${kpis.netProfit.toFixed(2)} with a ${kpis.profitMargin.toFixed(1)}% margin.`);
    }

    if (kpis.profitMargin < 0) {
      score -= 10;
    } else if (kpis.profitMargin > 25) {
      score += 5;
    }

    if (exceededBudgets > 0) {
      score -= exceededBudgets * 10;
      reasoning.push(`${exceededBudgets} departmental budget(s) have exceeded their allocated amount.`);
    }

    if (overdueInvoices > 0) {
      score -= overdueInvoices * 10;
      reasoning.push(`${overdueInvoices} invoice(s) are overdue.`);
    } else if (outstandingInvoices > 0) {
      reasoning.push(`${outstandingInvoices} invoice(s) are outstanding.`);
    }

    if (typeof kpis.runway === 'number' && kpis.runway < 3) {
      score -= 10;
      reasoning.push(`Runway is only ${kpis.runway} month(s) at the current burn rate.`);
    }

    const status: FinancialHealth['status'] = score >= HEALTH_FACTORS.healthy ? 'healthy' : score >= HEALTH_FACTORS.at_risk ? 'at_risk' : 'critical';

    return {
      score: Math.max(0, Math.min(100, score)),
      status,
      kpis,
      budgetSummaries,
      outstandingInvoices,
      overdueInvoices,
      reasoning,
    };
  }
}
