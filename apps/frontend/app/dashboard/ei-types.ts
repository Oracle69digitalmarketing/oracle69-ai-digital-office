export interface EnterpriseKpiMetrics {
  period: string;
  totalPipelineValue: number;
  weightedPipeline: number;
  openPipelineValue: number;
  wonRevenue: number;
  lostValue: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  totalOpportunities: number;
  winRate: number;
  totalLeads: number;
  qualifiedLeads: number;
  leadConversionRate: number;
  totalContacts: number;
  activeAccounts: number;
  accountsWithHealthScore: number;
  averageCustomerHealth: number;
  accountsAtRisk: number;
  criticalAccounts: number;
  activeChurnRisks: number;
  totalInteractions: number;
}

export interface BusinessHealthResult {
  score: number;
  status: 'healthy' | 'at_risk' | 'critical';
  reasoning: string;
  factors: string[];
}

export interface EnterpriseForecast {
  period: string;
  expectedRevenue: number;
  weightedPipeline: number;
  committedRevenue: number;
  conservative: number;
  bestCase: number;
  retentionRevenue: number;
  assumptions: Record<string, unknown>;
}

export interface EnterpriseReport {
  id: string;
  period: string;
  summary: {
    period: string;
    kpis: EnterpriseKpiMetrics;
    health: BusinessHealthResult;
    forecast: EnterpriseForecast;
    successPlanCount: number;
    churnRiskCount: number;
  };
  healthScore: number;
  createdAt: string;
}
