import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from "@nestjs/common";
import { TenantContextService } from "@oracle69/runtime";
import { ProcurementService } from "../services/procurement.service.js";
import { ProcurementKpiEngine } from "../services/procurement-kpi.engine.js";
import { ProcurementHealthEngine } from "../services/procurement-health.engine.js";
import { ProcurementInsightService } from "../services/procurement-insight.service.js";

@Controller("v1/procurement")
export class ProcurementController {
  constructor(
    private readonly procurementService: ProcurementService,
    private readonly kpiEngine: ProcurementKpiEngine,
    private readonly healthEngine: ProcurementHealthEngine,
    private readonly insightService: ProcurementInsightService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private runInTenant<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
    return this.tenantContext.run({ tenantId: orgId }, fn);
  }

  @Get("kpi")
  async getKpi(@Req() req: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.kpiEngine.computeMetrics(orgId));
  }

  @Get("health")
  async getHealth(@Req() req: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.healthEngine.assessHealth(orgId));
  }

  @Get("insights")
  async getInsights(@Req() req: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.insightService.generateInsights(orgId));
  }

  @Post("suppliers")
  async createSupplier(@Req() req: any, @Body() data: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () =>
      this.procurementService.createSupplier({ ...data, organizationId: orgId }),
    );
  }

  @Get("suppliers")
  async listSuppliers(@Req() req: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.procurementService.listSuppliers(orgId));
  }

  @Post("purchase-orders")
  async createPurchaseOrder(@Req() req: any, @Body() data: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () =>
      this.procurementService.createPurchaseOrder({ ...data, organizationId: orgId }),
    );
  }

  @Get("purchase-orders")
  async listPurchaseOrders(@Req() req: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.procurementService.listPurchaseOrders(orgId));
  }

  @Patch("purchase-orders/:id")
  async updatePurchaseOrder(@Req() req: any, @Param("id") id: string, @Body() data: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () =>
      this.procurementService.updatePurchaseOrder(id, { ...data, organizationId: orgId }),
    );
  }
}
