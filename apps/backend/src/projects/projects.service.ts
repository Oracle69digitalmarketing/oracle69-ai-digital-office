import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";
import { EventBus } from "@oracle69/shared";
import { CreateProjectDto } from "./dto/projects.dto.js";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
    private eventBus: EventBus,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
  }

  async findAll() {
    return this.prisma.project.findMany({
      where: { organizationId: this.organizationId },
      include: {
        tasks: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id, organizationId: this.organizationId },
      include: {
        tasks: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(data: CreateProjectDto) {
    const orgId = this.organizationId;

    const clientId = data.clientId;
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!client || client.organizationId !== orgId) {
        throw new BadRequestException("Client not found in this organization");
      }
    }

    const project = await this.prisma.project.create({
      data: {
        title: data.title,
        description: data.description ?? undefined,
        status: data.status ?? "planning",
        priority: data.priority ?? "medium",
        budget: data.budget,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        clientId: clientId ?? null,
        organizationId: orgId,
      },
    });

    this.eventBus.publish({
      type: "project.created",
      source: "ProjectsService",
      payload: { projectId: project.id, organizationId: orgId },
    });

    return project;
  }
}
