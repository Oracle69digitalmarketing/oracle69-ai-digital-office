import { Module, Provider } from "@nestjs/common";
import { ArticleService } from "./services/article.service.js";
import { IndexService } from "./services/index.service.js";
import { SearchService } from "./services/search.service.js";
import { KnowledgeKpiService } from "./services/knowledge-kpi.service.js";
import { KnowledgeHealthService } from "./services/knowledge-health.service.js";
import { KnowledgeAiService } from "./services/knowledge-ai.service.js";
import { RecommendationService } from "./services/recommendation.service.js";
import { KnowledgeReportService } from "./services/knowledge-report.service.js";
import {
  KNOWLEDGE_ARTICLE_REPOSITORY,
  PrismaArticleRepository,
} from "./repositories/article.repository.js";
import {
  KNOWLEDGE_INDEX_REPOSITORY,
  PrismaIndexRepository,
} from "./repositories/index.repository.js";
import {
  KNOWLEDGE_REPORT_REPOSITORY,
  PrismaReportRepository,
} from "./repositories/report.repository.js";
import { KnowledgeController } from "./controllers/knowledge.controller.js";
import { RuntimeModule, EventCatalogService, EventCategory } from "@oracle69/runtime";
import { GeminiModelProvider } from "@oracle69/sales-intelligence";
import { KnowledgeEventType } from "./events/knowledge.events.js";

const Repositories: Provider[] = [
  {
    provide: KNOWLEDGE_ARTICLE_REPOSITORY,
    useClass: PrismaArticleRepository,
  },
  {
    provide: KNOWLEDGE_INDEX_REPOSITORY,
    useClass: PrismaIndexRepository,
  },
  {
    provide: KNOWLEDGE_REPORT_REPOSITORY,
    useClass: PrismaReportRepository,
  },
];

@Module({
  imports: [RuntimeModule],
  controllers: [KnowledgeController],
  providers: [
    ...Repositories,
    ArticleService,
    IndexService,
    SearchService,
    KnowledgeKpiService,
    KnowledgeHealthService,
    KnowledgeAiService,
    RecommendationService,
    KnowledgeReportService,
    {
      provide: "AiModelProvider",
      useFactory: () => new GeminiModelProvider(process.env.GOOGLE_AI_API_KEY || ""),
    },
  ],
  exports: [
    ArticleService,
    IndexService,
    SearchService,
    KnowledgeKpiService,
    KnowledgeHealthService,
    KnowledgeAiService,
    RecommendationService,
    KnowledgeReportService,
    ...Repositories,
  ],
})
export class KnowledgeIntelligenceModule {
  constructor(private readonly eventCatalog: EventCatalogService) {
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.ARTICLE_CREATED,
      "A knowledge article was created.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.ARTICLE_UPDATED,
      "A knowledge article was updated.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.ARTICLE_PUBLISHED,
      "A knowledge article was published.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.ARTICLE_ARCHIVED,
      "A knowledge article was archived.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.ARTICLE_VERSION_CREATED,
      "A new version snapshot of a knowledge article was recorded.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.INDEX_UPDATED,
      "The knowledge search index was updated.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.REPORT_GENERATED,
      "A knowledge management report was generated.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      KnowledgeEventType.INSIGHT_GENERATED,
      "Knowledge intelligence insights were generated.",
      EventCategory.EXECUTIVE,
    );
  }
}
