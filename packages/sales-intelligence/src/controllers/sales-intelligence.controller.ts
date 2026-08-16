import { Controller, Get, Post, Param, Query, Body, Req } from "@nestjs/common";
import { SalesIntelligenceService } from "../services/sales-intelligence.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Controller("sales-intelligence")
export class SalesIntelligenceController {
  constructor(
    private readonly service: SalesIntelligenceService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get("leads/:id")
  getLeadAnalysis(@Param("id") id: string, @Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.analyzeLead(id),
    );
  }

  @Post("analyze/lead/:id")
  analyzeLead(@Param("id") id: string, @Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.analyzeLead(id),
    );
  }

  @Get("opportunities/:id")
  getOpportunityAnalysis(@Param("id") id: string, @Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.analyzeOpportunity(id),
    );
  }

  @Post("analyze/opportunity/:id")
  analyzeOpportunity(@Param("id") id: string, @Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.analyzeOpportunity(id),
    );
  }

  @Get("accounts/:id")
  getAccount360(@Param("id") id: string, @Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.getAccount360(id),
    );
  }

  @Get("pipeline")
  getPipelineIntelligence(@Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.getPipelineIntelligence(),
    );
  }

  @Get("forecast")
  getForecast(@Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.getForecast(),
    );
  }

  @Get("executive")
  getExecutiveIntelligence(@Req() req: any) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.getExecutiveIntelligence(),
    );
  }

  @Post("missions")
  createMission(
    @Body() body: { goal: string; priority?: "low" | "normal" | "high" | "critical" },
    @Req() req: any,
  ) {
    return this.tenantContext.run({ tenantId: req.user.organizationId }, () =>
      this.service.requestMission(body.goal, body.priority),
    );
  }
}
