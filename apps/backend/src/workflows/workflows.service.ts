import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventBus } from "@oracle69/shared";
import { ExecutionEngine } from "@oracle69/execution-engine";
import { AgentRegistry } from "@oracle69/agent-engine";

@Injectable()
export class WorkflowsService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
    private executionEngine: ExecutionEngine,
    private registry: AgentRegistry,
  ) {}

  onModuleInit() {
    // Knowledge Archiver: Archive completed tasks to Memory
    this.eventBus.ofType("TaskCompleted").subscribe(async (event) => {
      const payload = event.payload as any;
      this.logger.log(`Archiving completed task result: ${payload.taskId}`);

      try {
        const task = await this.prisma.task.findUnique({
          where: { id: payload.taskId },
        });

        if (task) {
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
        }
      } catch (error: any) {
        this.logger.error(`Failed to archive task result: ${error.message}`);
      }
    });
  }
  async createWorkflow(name: string, projectId: string) {
    return this.prisma.workflow.create({
      data: {
        name,
        projectId,
        status: "not_started",
      },
    });
  }

  async updateWorkflowStatus(id: string, status: string) {
    return this.prisma.workflow.update({
      where: { id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });
  }

  // More orchestration logic can be added here
}
