import type { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeSearchResult, KnowledgeKpis, KnowledgeHealth, KnowledgeReport } from '@oracle69/knowledge-intelligence';
import { apiClient } from "@/lib/api-client";

export const knowledgeClient = {
  async listArticles(organizationId: string, status?: KnowledgeArticleStatus, category?: string): Promise<KnowledgeArticle[]> {
    let url = `/knowledge/${organizationId}/articles`;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get<KnowledgeArticle[]>(url);
  },

  async getArticle(organizationId: string, id: string): Promise<KnowledgeArticle> {
    return apiClient.get<KnowledgeArticle>(`/knowledge/${organizationId}/articles/${id}`);
  },

  async search(organizationId: string, q: string, status?: KnowledgeArticleStatus): Promise<KnowledgeSearchResult[]> {
    let url = `/knowledge/${organizationId}/search?q=${encodeURIComponent(q)}`;
    if (status) url += `&status=${status}`;
    return apiClient.get<KnowledgeSearchResult[]>(url);
  },

  async getKpis(organizationId: string): Promise<KnowledgeKpis> {
    return apiClient.get<KnowledgeKpis>(`/knowledge/${organizationId}/kpis`);
  },

  async getHealth(organizationId: string): Promise<KnowledgeHealth> {
    return apiClient.get<KnowledgeHealth>(`/knowledge/${organizationId}/health`);
  },
  
  async getReports(organizationId: string): Promise<KnowledgeReport[]> {
    return apiClient.get<KnowledgeReport[]>(`/knowledge/${organizationId}/reports`);
  }
};
