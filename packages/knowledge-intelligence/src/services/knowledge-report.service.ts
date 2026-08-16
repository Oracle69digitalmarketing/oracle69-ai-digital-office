import { Inject, Injectable } from "@nestjs/common";
import {
  KNOWLEDGE_REPORT_REPOSITORY,
  type ReportRepository,
} from "../repositories/report.repository.js";
import { KnowledgeReport } from "../types.js";
import { KnowledgeKpiService } from "./knowledge-kpi.service.js";
import { KnowledgeHealthService } from "./knowledge-health.service.js";
import { KnowledgeAiService } from "./knowledge-ai.service.js";
import { RecommendationService } from "./recommendation.service.js";
import { EventBus, TenantContextService } from "@oracle69/runtime";
import { KnowledgeEventType } from "../events/knowledge.events.js";

const EVENT_SOURCE = "knowledge-intelligence";

export function currentPeriod(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

/**
 * Composes the knowledge intelligence services into a periodic knowledge
 * management report, persists it through the repository architecture and
 * publishes the canonical report-generated event.
 */
@Injectable()
export class KnowledgeReportService {
  constructor(
    private readonly kpiService: KnowledgeKpiService,
    private readonly healthService: KnowledgeHealthService,
    private readonly aiService: KnowledgeAiService,
    private readonly recommendationService: RecommendationService,
    @Inject(KNOWLEDGE_REPORT_REPOSITORY) private readonly reportRepo: ReportRepository,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async generateReport(
    organizationId?: string,
    period: string = currentPeriod(),
  ): Promise<KnowledgeReport> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const health = await this.healthService.assess(tenantId);
    const [insights, recommendations] = await Promise.all([
      this.aiService.generateInsights(health),
      this.recommendationService.generateRecommendations(health, tenantId),
    ]);

    const report = await this.reportRepo.create({
      period,
      knowledgeScore: health.score,
      summary: {
        kpis: health.kpis,
        health,
        recommendations,
        insights,
      },
      organizationId: tenantId,
    });

    await this.eventBus.publish(
      KnowledgeEventType.REPORT_GENERATED,
      {
        reportId: report.id,
        period,
        knowledgeScore: health.score,
      },
      { tenantId, source: EVENT_SOURCE },
    );

    return report;
  }

  async listReports(organizationId?: string, limit = 20): Promise<KnowledgeReport[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.reportRepo.findByOrganization(tenantId, limit);
  }
}
