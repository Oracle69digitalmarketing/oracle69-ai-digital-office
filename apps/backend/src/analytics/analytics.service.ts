import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private get organizationId() {
    return this.tenantContext.getTenantId();
  }

  async getKpis() {
    const orgId = this.organizationId;

    // Query latest snapshots for the tenant
    const eiKpiSnapshot = await this.prisma.eiKpiSnapshot.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });

    const oiOperationsSnapshot = await this.prisma.oiOperationsSnapshot.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });

    return {
      eiKpi: eiKpiSnapshot,
      oiOperations: oiOperationsSnapshot,
    };
  }
}
