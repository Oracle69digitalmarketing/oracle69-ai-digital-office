import { apiClient } from '@/lib/api-client';

export const procurementClient = {
  getKpi: () => apiClient.get('/v1/procurement/kpi'),
  getHealth: () => apiClient.get('/v1/procurement/health'),
  getInsights: () => apiClient.get('/v1/procurement/insights'),
  getSuppliers: () => apiClient.get('/v1/procurement/suppliers'),
  getPurchaseOrders: () => apiClient.get('/v1/procurement/purchase-orders'),
};
