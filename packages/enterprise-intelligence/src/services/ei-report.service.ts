import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { MessageBus, MissionManager, MissionStatus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import {
  EnterpriseIntelligenceEventType,
  EnterpriseIntelligenceEvent,
} from "../events/ei.events.js";
import { EiKpiEngine } from "./ei-kpi.engine.js";
import { EiBusinessHealthEngine } from "./ei-business-health.engine.js";
import { EiForecastEngine } from "./ei-forecast.engine.js";
import { currentPeriod } from "../utils/period.js";
import { SearchService } from "@oracle69/knowledge-intelligence";

/**
 * Composes the enterprise intelligence engines into an executive report,
 * persists it, publishes an event and escalates a strategic mission through
 * the existing MissionManager whenever business health is critical.
 */
@Injectable()
export class EiReportService {
  private readonly logger = new Logger(EiReportService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly kpiEngine: EiKpiEngine,
    private readonly healthEngine: EiBusinessHealthEngine,
    private readonly forecastEngine: EiForecastEngine,
    private readonly missionManager: MissionManager,
    private readonly messageBus: MessageBus,
    private readonly searchService: SearchService,
    @Optional() @Inject("PrismaService") prismaService?: PrismaClient,
  ) {
    this.prisma = prismaService ?? new PrismaClient();
  }

  async generateReport(organizationId: string, period: string = currentPeriod()) {
    this.logger.log(
      `Generating enterprise intelligence report for organization ${organizationId}, period ${period}`,
    );

    const [kpis, health, forecast, knowledgeInsights] = await Promise.all([
      this.kpiEngine.compute(organizationId),
      this.healthEngine.compute(organizationId),
      this.forecastEngine.compute(organizationId, period),
      this.searchService.search(organizationId, 'strategic business health analysis', 5),
    ]);
    
    const successPlanCount = await this.prisma.csSuccessPlan.count({
      where: { crmOrganization: { organizationId } },
    });
    const churnRiskCount = await this.prisma.csChurnRisk.count({
      where: { crmOrganization: { organizationId } },
    });

    const summary = {
      period,
      kpis,
      health,
      forecast,
      successPlanCount,
      churnRiskCount,
      knowledgeContext: knowledgeInsights,
    };

    const report = await this.prisma.eiEnterpriseReport.create({
      data: {
        organizationId,
        period,
        summary: summary as unknown as object,
        healthScore: health.score,
      },
    });

    this.messageBus.publish(
      EnterpriseIntelligenceEventType.REPORT_GENERATED,
      new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.REPORT_GENERATED, {
        organizationId,
        reportId: report.id,
        period,
        healthScore: health.score,
      }),
    );

    if (health.status === "critical") {
      const missionId = uuidv4();
      await this.missionManager.createMission({
        id: missionId,
        goal:
          `Enterprise intelligence: business health is critical (score ${health.score}/100) for ` +
          `organization ${organizationId}. Execute the enterprise recovery plan.`,
        priority: "critical",
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        owner: "enterprise-intelligence",
        status: MissionStatus.DRAFT,
        tenantId: organizationId,
      });

      this.messageBus.publish(
        EnterpriseIntelligenceEventType.EXECUTIVE_ALERT_REQUIRED,
        new EnterpriseIntelligenceEvent(EnterpriseIntelligenceEventType.EXECUTIVE_ALERT_REQUIRED, {
          organizationId,
          missionId,
          health,
        }),
      );
    }

    return { id: report.id, period, summary };
  }

  async listReports(organizationId: string, take = 20) {
    return this.prisma.eiEnterpriseReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}
