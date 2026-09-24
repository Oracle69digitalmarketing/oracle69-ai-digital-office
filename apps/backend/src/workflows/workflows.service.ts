import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventBus } from "@oracle69/shared";
import { ExecutionEngine } from "@oracle69/execution-engine";
import { AgentRegistry } from "@oracle69/agent-engine";
import { TenantContextService } from "@oracle69/runtime";
import { ALLOWED_WORKFLOW_STATUSES } from "./dto/workflows.dto.js";

@Injectable()
export class WorkflowsService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
    private executionEngine: ExecutionEngine,
    private registry: AgentRegistry,
    private tenantContext: TenantContextService,
  ) {}

  private resolveTenantId(): string {
    return this.tenantContext.resolveTenantId();
  }

  onModuleInit() {
    this.eventBus.ofType("TaskCompleted").subscribe(async (event) => {
      const payload = event.payload as any;
      this.logger.log(`Archiving completed task result: ${payload.taskId}`);

      let tenantId: string;
      try {
        tenantId = this.resolveTenantId();
      } catch {
        this.logger.warn(
          `Skipping archive for task ${payload.taskId}: no active tenant context`,
        );
        return;
      }

      try {
        const task = await this.prisma.task.findUnique({
          where: { id: payload.taskId },
          include: { project: true },
        });

        if (!task) {
          this.logger.warn(
            `Skipping archive for task ${payload.taskId}: task not found`,
          );
          return;
        }

        if (task.project.organizationId !== tenantId) {
          this.logger.warn(
            `Skipping archive for task ${payload.taskId}: task belongs to org "${task.project.organizationId}" but current tenant is "${tenantId}"`,
          );
          return;
        }

        await this.prisma.memory.create({
          data: {
            category: "TASK_RESULT",
            summary: `Result for task "${task.title}": ${JSON.stringify(payload.result).substring(0, 500)}`,
            projectId: task.projectId,
            accessLevel: "internal",
            confidence: 1.0,
          },
        });
        this.logger.log(`Successfully archived result to Knowledge Hub`);
      } catch (error: any) {
        this.logger.error(`Failed to archive task result: ${error.message}`);
      }
    });
  }

  async createWorkflow(name: string, projectId: string) {
    const tenantId = this.resolveTenantId();

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== tenantId) {
      throw new NotFoundException("Project not found");
    }

    return this.prisma.workflow.create({
      data: {
        name,
        projectId,
        status: "not_started",
      },
    });
  }

  async findWorkflow(id: string) {
    const tenantId = this.resolveTenantId();

    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!workflow || workflow.project.organizationId !== tenantId) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async listWorkflows() {
    const tenantId = this.resolveTenantId();

    return this.prisma.workflow.findMany({
      where: { project: { organizationId: tenantId } },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateWorkflowStatus(id: string, status: string) {
    if (!ALLOWED_WORKFLOW_STATUSES.includes(status as (typeof ALLOWED_WORKFLOW_STATUSES)[number])) {
      throw new BadRequestException(`Invalid workflow status: ${status}`);
    }

    const tenantId = this.resolveTenantId();

    const existing = await this.prisma.workflow.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.organizationId !== tenantId) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return this.prisma.workflow.update({
      where: { id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });
  }
}
