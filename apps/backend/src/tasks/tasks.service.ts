import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventBus } from "@oracle69/shared";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId() {
    return this.tenantContext.getTenantId();
  }

  async findAll() {
    return this.prisma.task.findMany({
      where: {
        project: { organizationId: this.organizationId },
      },
      include: {
        assignedAgent: true,
        project: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedAgent: true,
        project: true,
      },
    });

    if (!task || task.project.organizationId !== this.organizationId) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async updateStatus(id: string, status: string, userId?: string) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      include: { project: true, assignedAgent: true },
    });

    if (!existing || existing.project.organizationId !== this.organizationId) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: { status },
      include: { assignedAgent: true },
    });

    this.logger.log(`Task ${id} status updated to ${status}`);

    // Publish event for activity feed
    this.eventBus.publish({
      type: "task.status_changed",
      source: "TasksService",
      payload: {
        taskId: id,
        status,
        userId,
        organizationId: this.organizationId,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        action: "UPDATE_STATUS",
        resource: "Task",
        status: "SUCCESS",
        userId: userId,
        organizationId: this.organizationId!,
        createdAt: new Date(),
      },
    });

    return task;
  }

  async create(data: any) {
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project || project.organizationId !== this.organizationId) {
      throw new NotFoundException("Project not found");
    }

    const { organizationId: _clientOrgId, ...safeData } = data;

    const task = await this.prisma.task.create({
      data: safeData,
    });

    this.eventBus.publish({
      type: "task.created",
      source: "TasksService",
      payload: {
        taskId: task.id,
        title: task.title,
        organizationId: this.organizationId,
      },
    });

    return task;
  }
}
