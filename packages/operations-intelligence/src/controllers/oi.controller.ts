import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { OrgClaimGuard } from "@oracle69/shared";
import { OiOperationsEngine } from "../services/oi-operations.engine.js";
import { OiWorkflowEngine } from "../services/oi-workflow.engine.js";
import { OiAgentEngine } from "../services/oi-agent.engine.js";
import { OiInsightEngine } from "../services/oi-insight.engine.js";
import { OiReportService } from "../services/oi-report.service.js";

@Controller("operations-intelligence")
@UseGuards(OrgClaimGuard)
export class OperationsIntelligenceController {
  constructor(
    private readonly operationsEngine: OiOperationsEngine,
    private readonly workflowEngine: OiWorkflowEngine,
    private readonly agentEngine: OiAgentEngine,
    private readonly insightEngine: OiInsightEngine,
    private readonly reportService: OiReportService,
  ) {}

  @Get("operations/:organizationId")
  getOperations(@Param("organizationId") organizationId: string, @Query("period") period?: string) {
    return this.operationsEngine.generateSnapshot(organizationId, period);
  }

  @Get("operations-snapshots/:organizationId")
  listOperationsSnapshots(@Param("organizationId") organizationId: string) {
    return this.operationsEngine.listSnapshots(organizationId);
  }

  @Get("workflows/:organizationId")
  getWorkflows(@Param("organizationId") organizationId: string, @Query("period") period?: string) {
    return this.workflowEngine.generateSnapshot(organizationId, period);
  }

  @Get("workflow-snapshots/:organizationId")
  listWorkflowSnapshots(@Param("organizationId") organizationId: string) {
    return this.workflowEngine.listSnapshots(organizationId);
  }

  @Get("agents/:organizationId")
  getAgents(@Param("organizationId") organizationId: string, @Query("period") period?: string) {
    return this.agentEngine.generateUtilization(organizationId, period);
  }

  @Get("agent-utilization/:organizationId")
  listAgentUtilization(@Param("organizationId") organizationId: string) {
    return this.agentEngine.listUtilization(organizationId);
  }

  @Post("insights/:organizationId")
  generateInsights(
    @Param("organizationId") organizationId: string,
    @Query("period") period?: string,
  ) {
    return this.insightEngine.generateInsights(organizationId, period);
  }

  @Get("insights/:organizationId")
  listInsights(@Param("organizationId") organizationId: string) {
    return this.insightEngine.listInsights(organizationId);
  }

  @Get("recommendations/:organizationId")
  listRecommendations(@Param("organizationId") organizationId: string) {
    return this.insightEngine.listRecommendations(organizationId);
  }

  @Post("reports/:organizationId")
  generateReport(
    @Param("organizationId") organizationId: string,
    @Query("period") period?: string,
  ) {
    return this.reportService.generateReport(organizationId, period);
  }

  @Get("reports/:organizationId")
  listReports(@Param("organizationId") organizationId: string) {
    return this.reportService.listReports(organizationId);
  }
}
