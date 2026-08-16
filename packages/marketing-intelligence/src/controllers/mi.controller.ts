import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { MiCampaignEngine } from "../services/mi-campaign.engine.js";
import type { CampaignCreateInput } from "../services/mi-campaign.engine.js";
import { MiSeoEngine } from "../services/mi-seo.engine.js";
import { MiConversionEngine } from "../services/mi-conversion.engine.js";
import { MiLeadScoreEngine } from "../services/mi-lead-score.engine.js";
import { MiGrowthInsightEngine } from "../services/mi-growth-insight.engine.js";
import { MiReportService } from "../services/mi-report.service.js";

@Controller("marketing-intelligence")
export class MarketingIntelligenceController {
  constructor(
    private readonly campaignEngine: MiCampaignEngine,
    private readonly seoEngine: MiSeoEngine,
    private readonly conversionEngine: MiConversionEngine,
    private readonly leadScoreEngine: MiLeadScoreEngine,
    private readonly growthInsightEngine: MiGrowthInsightEngine,
    private readonly reportService: MiReportService,
  ) {}

  @Post("campaigns/:organizationId")
  createCampaign(
    @Param("organizationId") organizationId: string,
    @Body() body: CampaignCreateInput,
  ) {
    return this.campaignEngine.createCampaign(organizationId, body);
  }

  @Get("campaigns/:organizationId")
  listCampaigns(@Param("organizationId") organizationId: string) {
    return this.campaignEngine.listCampaigns(organizationId);
  }

  @Get("campaigns/:organizationId/metrics")
  getCampaignMetrics(
    @Param("organizationId") organizationId: string,
    @Query("period") period?: string,
  ) {
    return this.campaignEngine.generateMetrics(organizationId, period);
  }

  @Get("campaign-metrics/:organizationId")
  listCampaignMetrics(@Param("organizationId") organizationId: string) {
    return this.campaignEngine.listMetrics(organizationId);
  }

  @Get("seo/:organizationId")
  getSeo(@Param("organizationId") organizationId: string, @Query("period") period?: string) {
    return this.seoEngine.generateSnapshot(organizationId, period);
  }

  @Get("seo-snapshots/:organizationId")
  listSeoSnapshots(@Param("organizationId") organizationId: string) {
    return this.seoEngine.listSnapshots(organizationId);
  }

  @Get("conversion/:organizationId")
  getConversion(@Param("organizationId") organizationId: string, @Query("period") period?: string) {
    return this.conversionEngine.generateSnapshot(organizationId, period);
  }

  @Get("conversion-snapshots/:organizationId")
  listConversionSnapshots(@Param("organizationId") organizationId: string) {
    return this.conversionEngine.listSnapshots(organizationId);
  }

  @Post("leads/:organizationId/score")
  scoreLeads(@Param("organizationId") organizationId: string) {
    return this.leadScoreEngine.generate(organizationId);
  }

  @Get("lead-scores/:organizationId")
  listLeadScores(@Param("organizationId") organizationId: string) {
    return this.leadScoreEngine.listScores(organizationId);
  }

  @Post("insights/:organizationId")
  generateInsights(
    @Param("organizationId") organizationId: string,
    @Query("period") period?: string,
  ) {
    return this.growthInsightEngine.generateGrowthInsights(organizationId, period);
  }

  @Get("insights/:organizationId")
  listInsights(@Param("organizationId") organizationId: string) {
    return this.growthInsightEngine.listInsights(organizationId);
  }

  @Get("pricing-suggestions/:organizationId")
  listPricingSuggestions(@Param("organizationId") organizationId: string) {
    return this.growthInsightEngine.listPricingSuggestions(organizationId);
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
