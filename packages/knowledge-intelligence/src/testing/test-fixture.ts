import { EventBus, EventCatalogService, TenantContextService } from '@oracle69/runtime';
import { ArticleService } from '../services/article.service.js';
import { IndexService } from '../services/index.service.js';
import { SearchService } from '../services/search.service.js';
import { KnowledgeKpiService } from '../services/knowledge-kpi.service.js';
import { KnowledgeHealthService } from '../services/knowledge-health.service.js';
import { KnowledgeAiService } from '../services/knowledge-ai.service.js';
import { RecommendationService } from '../services/recommendation.service.js';
import { KnowledgeReportService } from '../services/knowledge-report.service.js';
import {
  ArticleRepository,
  KNOWLEDGE_ARTICLE_REPOSITORY,
  InMemoryArticleRepository,
} from '../repositories/article.repository.js';
import {
  IndexRepository,
  KNOWLEDGE_INDEX_REPOSITORY,
  InMemoryIndexRepository,
} from '../repositories/index.repository.js';
import {
  ReportRepository,
  KNOWLEDGE_REPORT_REPOSITORY,
  InMemoryReportRepository,
} from '../repositories/report.repository.js';

export interface KnowledgeTestContext {
  articleService: ArticleService;
  indexService: IndexService;
  searchService: SearchService;
  kpiService: KnowledgeKpiService;
  healthService: KnowledgeHealthService;
  aiService: KnowledgeAiService;
  recommendationService: RecommendationService;
  reportService: KnowledgeReportService;
  articleRepo: InMemoryArticleRepository;
  indexRepo: InMemoryIndexRepository;
  reportRepo: InMemoryReportRepository;
  eventBus: EventBus;
  catalog: EventCatalogService;
  tenantContext: TenantContextService;
  events: Array<{ type: string; payload: unknown; tenantId?: string }>;
  close(): void;
}

/**
 * Builds the Knowledge Intelligence services wired with the canonical (real)
 * EventBus, EventCatalogService and TenantContextService plus in-memory
 * repositories. Every published event is captured in `events` for assertion.
 */
export function createKnowledgeTestModule(): KnowledgeTestContext {
  const events: Array<{ type: string; payload: unknown; tenantId?: string }> = [];
  const catalog = new EventCatalogService();
  const tenantContext = new TenantContextService();
  const eventBus = new EventBus(catalog, tenantContext);
  eventBus.allEvents().subscribe((event) => {
    events.push({ type: event.type, payload: event.payload, tenantId: event.tenantId });
  });

  const articleRepo = new InMemoryArticleRepository();
  const indexRepo = new InMemoryIndexRepository();
  const reportRepo = new InMemoryReportRepository();

  const articleService = new ArticleService(articleRepo, eventBus, tenantContext);
  const indexService = new IndexService(articleRepo, indexRepo, eventBus, tenantContext);
  const searchService = new SearchService(articleRepo, indexRepo, indexService, tenantContext);
  const kpiService = new KnowledgeKpiService(articleRepo, indexRepo, tenantContext);
  const healthService = new KnowledgeHealthService(kpiService);
  const aiService = new KnowledgeAiService(undefined as never);
  const recommendationService = new RecommendationService(articleRepo, tenantContext);
  const reportService = new KnowledgeReportService(
    kpiService,
    healthService,
    aiService,
    recommendationService,
    reportRepo,
    eventBus,
    tenantContext,
  );

  return {
    articleService,
    indexService,
    searchService,
    kpiService,
    healthService,
    aiService,
    recommendationService,
    reportService,
    articleRepo,
    indexRepo,
    reportRepo,
    eventBus,
    catalog,
    tenantContext,
    events,
    close() {
      eventBus.complete();
    },
  };
}

export { KNOWLEDGE_ARTICLE_REPOSITORY, KNOWLEDGE_INDEX_REPOSITORY, KNOWLEDGE_REPORT_REPOSITORY };
