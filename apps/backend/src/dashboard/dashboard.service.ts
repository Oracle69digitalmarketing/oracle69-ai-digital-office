import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
  }

  async getSummary() {
    const orgId = this.organizationId;

    const [clients, projects, tasks, revenue] = await Promise.all([
      this.prisma.client.count({ where: { organizationId: orgId } }),
      this.prisma.project.count({ where: { organizationId: orgId } }),
      this.prisma.task.count({ where: { project: { organizationId: orgId } } }),
      this.prisma.finTransaction.aggregate({
        where: { organizationId: orgId, type: "income" },
        _sum: { amount: true },
      }),
    ]);

    return {
      activeClients: clients,
      activeProjects: projects,
      pendingTasks: tasks,
      monthlyRevenue: revenue._sum.amount || 0,
    };
  }
}
