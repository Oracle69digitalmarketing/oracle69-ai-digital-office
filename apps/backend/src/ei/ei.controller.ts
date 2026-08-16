import { Controller, Get, UseGuards, Req, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { TenantContextService } from "@oracle69/runtime";
import {
  EiKpiEngine,
  EiBusinessHealthEngine,
  EiForecastEngine,
  EiReportService,
} from "@oracle69/enterprise-intelligence";

/**
 * Tenant-aware controller for Executive Intelligence.
 *
 * Enforces tenant isolation by resolving the organizationId from the
 * authenticated request context and wrapping service calls in TenantContext.
 */
@Controller("v1/ei")
@UseGuards(JwtAuthGuard)
export class EiController {
  constructor(
    private readonly kpiEngine: EiKpiEngine,
    private readonly healthEngine: EiBusinessHealthEngine,
    private readonly forecastEngine: EiForecastEngine,
    private readonly reportService: EiReportService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get("kpi")
  getKpi(@Req() req: any, @Query("period") period?: string) {
    const organizationId = req.user.organizationId;
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.kpiEngine.generateSnapshot(organizationId, period),
    );
  }

  @Get("health")
  getHealth(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.healthEngine.generateSnapshot(organizationId),
    );
  }

  @Get("forecast")
  getForecast(@Req() req: any, @Query("period") period?: string) {
    const organizationId = req.user.organizationId;
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.forecastEngine.generateForecast(organizationId, period),
    );
  }

  @Get("reports")
  getReports(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.reportService.listReports(organizationId),
    );
  }
}
