import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";
import { EventBus } from "@oracle69/shared";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
    private eventBus: EventBus,
  ) {}

  private get organizationId() {
    return this.tenantContext.getTenantId();
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

  async create(data: any) {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        organizationId: this.organizationId,
      },
    });

    this.eventBus.publish({
      type: "project.created",
      source: "ProjectsService",
      payload: { projectId: project.id, organizationId: this.organizationId },
    });

    return project;
  }
}
