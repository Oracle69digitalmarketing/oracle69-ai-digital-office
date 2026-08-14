import { apiClient } from "@/lib/api-client";
import { 
  EnterpriseKpiMetrics, 
  BusinessHealthResult, 
  EnterpriseForecast, 
  EnterpriseReport 
} from "./ei-types";

/**
 * Frontend API client for Executive Intelligence (Sprint 10).
 * Consumes the /v1/ei endpoints.
 */
export const eiClient = {
  /**
   * Fetches enterprise-wide KPI metrics.
   */
  async getKpi(period?: string): Promise<EnterpriseKpiMetrics> {
    const endpoint = period ? `/v1/ei/kpi?period=${period}` : '/v1/ei/kpi';
    return apiClient.get<EnterpriseKpiMetrics>(endpoint);
  },

  /**
   * Fetches the unified business health snapshot.
   */
  async getHealth(): Promise<BusinessHealthResult> {
    return apiClient.get<BusinessHealthResult>('/v1/ei/health');
  },

  /**
   * Fetches the enterprise revenue forecast.
   */
  async getForecast(period?: string): Promise<EnterpriseForecast> {
    const endpoint = period ? `/v1/ei/forecast?period=${period}` : '/v1/ei/forecast';
    return apiClient.get<EnterpriseForecast>(endpoint);
  },

  /**
   * Lists generated executive reports.
   */
  async getReports(): Promise<EnterpriseReport[]> {
    return apiClient.get<EnterpriseReport[]>('/v1/ei/reports');
  }
};
