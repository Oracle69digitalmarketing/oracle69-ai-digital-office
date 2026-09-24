import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AgentRegistry } from "@oracle69/agent-engine";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private registry: AgentRegistry,
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
  }

  async findAll() {
    return this.prisma.agent.findMany({
      where: { organizationId: this.organizationId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent || agent.organizationId !== this.organizationId) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }
}
