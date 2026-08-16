export enum KnowledgeArticleStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

/** A versioned, tenant-scoped knowledge article/document. */
export interface KnowledgeArticle {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: string;
  tags: string[];
  status: KnowledgeArticleStatus;
  version: number;
  authorId?: string;
  publishedAt?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/** Immutable snapshot of an article at a specific version. */
export interface KnowledgeArticleVersion {
  id: string;
  articleId: string;
  version: number;
  title: string;
  summary?: string;
  content: string;
  category: string;
  tags: string[];
  changeNote?: string;
  organizationId: string;
  createdAt: string;
}

/** A weighted keyword entry in the tenant-scoped article index. */
export interface KnowledgeIndexEntry {
  id: string;
  articleId: string;
  token: string;
  weight: number;
  organizationId: string;
}

/** Ranked match produced by the tenant-scoped knowledge search. */
export interface KnowledgeSearchResult {
  articleId: string;
  title: string;
  category: string;
  status: KnowledgeArticleStatus;
  version: number;
  score: number;
  excerpt: string;
}

/** Knowledge management KPIs derived from the persisted articles. */
export interface KnowledgeKpis {
  totalArticles: number;
  draftCount: number;
  publishedCount: number;
  archivedCount: number;
  categories: string[];
  averageVersionCount: number;
  indexedArticles: number;
  indexCoverage: number;
  staleArticles: number;
  draftBacklog: number;
}

/** Knowledge health snapshot combining KPIs and content exposure. */
export interface KnowledgeHealth {
  score: number;
  status: "healthy" | "at_risk" | "critical";
  kpis: KnowledgeKpis;
  reasoning: string[];
}

export interface KnowledgeAiInsight {
  type: "forecast" | "recommendation" | "alert";
  title: string;
  content: string;
  priority: "low" | "normal" | "high";
  impact?: string;
}

export interface KnowledgeRecommendation {
  title: string;
  reason: string;
  priority: "low" | "normal" | "high";
  category?: string;
}

/** Persisted knowledge intelligence report for a period. */
export interface KnowledgeReport {
  id: string;
  period: string;
  knowledgeScore: number;
  summary: {
    kpis: KnowledgeKpis;
    health: KnowledgeHealth;
    recommendations: KnowledgeRecommendation[];
    insights: KnowledgeAiInsight[];
  };
  organizationId: string;
  createdAt: string;
}
