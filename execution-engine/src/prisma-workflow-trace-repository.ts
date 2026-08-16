import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { WorkflowStep, WorkflowTrace } from "@oracle69/shared";
import { WorkflowTraceRepository } from "./execution-engine.js";

@Injectable()
export class PrismaWorkflowTraceRepository implements WorkflowTraceRepository {
  constructor(@Inject("PrismaService") private readonly prisma: PrismaClient) {}

  async saveStep(step: WorkflowStep, organizationId?: string): Promise<void> {
    await this.prisma.workflowStepRecord.upsert({
      where: { id: step.stepId },
      update: {
        status: step.status,
        endTime: step.endTime,
        result: step.result,
        error: step.error,
      },
      create: {
        id: step.stepId,
        stepId: step.stepId,
        workflowId: "default-workflow",
        taskId: step.taskId,
        agentId: step.agentId,
        status: step.status,
        startTime: step.startTime,
        endTime: step.endTime,
        result: step.result,
        error: step.error,
        organizationId: organizationId || "system",
      },
    });
  }

  async getTrace(workflowId: string): Promise<WorkflowTrace | null> {
    const records = await this.prisma.workflowStepRecord.findMany({
      where: { workflowId },
      orderBy: { startTime: "asc" },
    });

    if (records.length === 0) return null;

    return {
      workflowId,
      steps: records.map((r: any) => ({
        stepId: r.stepId,
        taskId: r.taskId,
        agentId: r.agentId,
        status: r.status as any,
        startTime: r.startTime,
        endTime: r.endTime || undefined,
        result: r.result,
        error: r.error || undefined,
      })),
      startTime: records[0].startTime,
      status: "executing",
    };
  }
}
