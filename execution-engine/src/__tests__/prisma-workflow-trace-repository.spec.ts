import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { PrismaWorkflowTraceRepository } from "../prisma-workflow-trace-repository.js";
import { WorkflowStep } from "@oracle69/shared";

describe("PrismaWorkflowTraceRepository", () => {
  let repository: PrismaWorkflowTraceRepository;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      workflowStepRecord: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
    };
    repository = new PrismaWorkflowTraceRepository(prismaMock as any);
  });

  it("should upsert a workflow step", async () => {
    const step: WorkflowStep = {
      stepId: "step-1",
      taskId: "task-1",
      agentId: "agent-1",
      status: "completed",
      startTime: new Date(),
      endTime: new Date(),
      result: { success: true },
    };

    await repository.saveStep(step, "org-1");

    expect(prismaMock.workflowStepRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "step-1" },
        create: expect.objectContaining({
          stepId: "step-1",
          organizationId: "org-1",
        }),
      }),
    );
  });

  it("should retrieve a workflow trace", async () => {
    const mockRecords = [
      {
        stepId: "step-1",
        taskId: "task-1",
        agentId: "agent-1",
        status: "completed",
        startTime: new Date(),
        endTime: new Date(),
        result: { success: true },
        error: null,
      },
    ];
    prismaMock.workflowStepRecord.findMany.mockResolvedValue(mockRecords);

    const trace = await repository.getTrace("workflow-1");

    expect(prismaMock.workflowStepRecord.findMany).toHaveBeenCalledWith({
      where: { workflowId: "workflow-1" },
      orderBy: { startTime: "asc" },
    });
    expect(trace?.steps).toHaveLength(1);
    expect(trace?.steps[0].stepId).toBe("step-1");
  });
});
