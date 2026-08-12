export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface FinTransaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  description?: string;
  organizationId: string;
  budgetId?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum BudgetPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum BudgetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface FinBudget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  status: BudgetStatus;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface FinInvoice {
  id: string;
  number: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  clientId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTrend {
  period: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface FinancialKpis {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  burnRate: number;
  runway?: number;
  trends: FinancialTrend[];
}

/** Budget extended with derived allocation/utilization metrics. */
export interface BudgetSummary extends FinBudget {
  remaining: number;
  utilization: number;
  exceeded: boolean;
}

/** Financial health snapshot combining KPIs, budgets and invoice exposure. */
export interface FinancialHealth {
  score: number;
  status: 'healthy' | 'at_risk' | 'critical';
  kpis: FinancialKpis;
  budgetSummaries: BudgetSummary[];
  outstandingInvoices: number;
  overdueInvoices: number;
  reasoning: string[];
}

export interface FinancialAiInsight {
  type: 'forecast' | 'recommendation' | 'alert';
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  impact?: string;
}
