import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { EiKpiEngine } from "../services/ei-kpi.engine.js";
import { EiBusinessHealthEngine } from "../services/ei-business-health.engine.js";
import { EiForecastEngine } from "../services/ei-forecast.engine.js";
import { EiScenarioEngine } from "../services/ei-scenario.engine.js";
import type { ScenarioParameters } from "../services/ei-scenario.engine.js";
import { EiInsightEngine } from "../services/ei-insight.engine.js";
import { EiReportService } from "../services/ei-report.service.js";

@Controller("enterprise-intelligence")
export class EnterpriseIntelligenceController {
  constructor(
    private readonly kpiEngine: EiKpiEngine,
    private readonly healthEngine: EiBusinessHealthEngine,
    private readonly forecastEngine: EiForecastEngine,
    private readonly scenarioEngine: EiScenarioEngine,
    private readonly insightEngine: EiInsightEngine,
    private readonly reportService: EiReportService,
  ) {}

  @Get("kpis/:organizationId")
  getKpis(@Param("organizationId") organizationId: string, @Query("period") period?: string) {
    return this.kpiEngine.generateSnapshot(organizationId, period);
  }

  @Get("business-health/:organizationId")
  getBusinessHealth(@Param("organizationId") organizationId: string) {
    return this.healthEngine.generateSnapshot(organizationId);
  }

  @Get("forecast/:organizationId")
  getForecast(@Param("organizationId") organizationId: string, @Query("period") period?: string) {
    return this.forecastEngine.generateForecast(organizationId, period);
  }

  @Post("scenarios/:organizationId")
  runScenario(@Param("organizationId") organizationId: string, @Body() body: ScenarioParameters) {
    return this.scenarioEngine.runScenario(organizationId, body);
  }

  @Post("insights/:organizationId")
  generateInsights(@Param("organizationId") organizationId: string) {
    return this.insightEngine.generateInsights(organizationId);
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
  generateReport(@Param("organizationId") organizationId: string) {
    return this.reportService.generateReport(organizationId);
  }

  @Get("reports/:organizationId")
  listReports(@Param("organizationId") organizationId: string) {
    return this.reportService.listReports(organizationId);
  }
}
