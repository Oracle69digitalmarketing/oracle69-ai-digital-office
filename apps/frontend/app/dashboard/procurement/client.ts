import { apiClient } from "@/lib/api-client";

export interface ProcurementKpiMetrics {
  totalSpend: number;
  poCount: number;
  poStatusBreakdown: Record<string, number>;
  spendBySupplier: Record<string, number>;
}

export interface ProcurementHealthResult {
  status: "healthy" | "warning" | "critical";
  score: number;
  reasoning: string;
}

export interface ProcurementInsights {
  summary: string;
  recommendation: string;
}

export const procurementClient = {
  getKpi: () => apiClient.get<ProcurementKpiMetrics>("/v1/procurement/kpi"),
  getHealth: () => apiClient.get<ProcurementHealthResult>("/v1/procurement/health"),
  getInsights: () => apiClient.get<ProcurementInsights>("/v1/procurement/insights"),
  getSuppliers: () => apiClient.get("/v1/procurement/suppliers"),
  getPurchaseOrders: () => apiClient.get("/v1/procurement/purchase-orders"),
};
