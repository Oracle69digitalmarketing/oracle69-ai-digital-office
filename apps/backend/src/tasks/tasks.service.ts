import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventBus } from "@oracle69/shared";

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
  ) {}

  async findAll() {
    return this.prisma.task.findMany({
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

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async updateStatus(id: string, status: string, userId?: string) {
    const task = await this.prisma.task.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Task ${id} status updated to ${status}`);

    // Publish event for activity feed
    this.eventBus.publish({
      type: "TaskStatusChanged",
      source: "TasksService",
      payload: { taskId: id, status, userId },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        action: "UPDATE_STATUS",
        resource: "Task",
        status: "SUCCESS",
        userId: userId,
        createdAt: new Date(),
      },
    });

    return task;
  }

  async create(data: any) {
    const task = await this.prisma.task.create({
      data,
    });

    this.eventBus.publish({
      type: "TaskCreated",
      source: "TasksService",
      payload: { taskId: task.id, title: task.title },
    });

    return task;
  }
}
