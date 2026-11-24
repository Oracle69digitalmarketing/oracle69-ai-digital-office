import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { ExecutionEngine } from "../execution-engine";
import { BaseAgent } from "@oracle69/agent-engine";
import { TaskContext } from "@oracle69/shared";

describe("ExecutionEngine", () => {
  let engine: ExecutionEngine;
  let mockAgent: any;
  let mockEventBus: { publish: any };
  let mockMemory: { saveBusinessMemory: any };
  let mockRepository: { saveStep: any; getTrace: any };

  const tenantContext = {
    organizationId: "org-123",
    productIdentifier: "business-architect",
  };

  const task: TaskContext = {
    taskId: "task-1",
    projectId: "proj-1",
    sessionId: "sess-1",
    priority: "medium",
    objective: "Test task",
    context: {},
  };

  beforeEach(() => {
    mockEventBus = { publish: jest.fn() };
    mockMemory = { saveBusinessMemory: jest.fn().mockResolvedValue(undefined) };
    mockRepository = {
      saveStep: jest.fn().mockResolvedValue(undefined),
      getTrace: jest.fn().mockResolvedValue(null),
    };
    engine = new ExecutionEngine(mockEventBus as any, mockMemory as any, mockRepository as any);
    mockAgent = {
      metadata: { id: "agent-1", name: "Agent 1", role: "test-agent" },
      onTaskReceived: jest.fn(),
      onTaskCompleted: jest.fn(),
      onTaskFailed: jest.fn(),
      execute: jest.fn(),
    };
  });

  const expectNoExecutionOrPersistence = () => {
    expect(mockAgent.onTaskReceived).not.toHaveBeenCalled();
    expect(mockAgent.execute).not.toHaveBeenCalled();
    expect(mockAgent.onTaskCompleted).not.toHaveBeenCalled();
    expect(mockAgent.onTaskFailed).not.toHaveBeenCalled();
    expect(mockMemory.saveBusinessMemory).not.toHaveBeenCalled();
    expect(mockRepository.saveStep).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  };

  it("should execute a task successfully with the exact authenticated organizationId", async () => {
    mockAgent.execute.mockResolvedValue("success");

    const result = await engine.executeTask(task, mockAgent, 3, tenantContext);

    expect(result).toBe("success");
    expect(mockAgent.onTaskReceived).toHaveBeenCalledWith(task);
    expect(mockAgent.onTaskCompleted).toHaveBeenCalledWith(task, "success");
    expect(mockMemory.saveBusinessMemory).toHaveBeenCalledTimes(1);
    expect(mockMemory.saveBusinessMemory.mock.calls[0][0].organizationId).toBe("org-123");
    expect(mockRepository.saveStep).toHaveBeenCalledTimes(2);
    expect(mockRepository.saveStep.mock.calls[0][1]).toBe("org-123");
  });

  it("should retry on failure and eventually succeed", async () => {
    mockAgent.execute.mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce("success");

    const result = await engine.executeTask(task, mockAgent, 2, tenantContext);

    expect(result).toBe("success");
    expect(mockAgent.execute).toHaveBeenCalledTimes(2);
    expect(mockMemory.saveBusinessMemory.mock.calls[0][0].organizationId).toBe("org-123");
  });

  it("should fail after all retries", async () => {
    mockAgent.execute.mockRejectedValue(new Error("permanent fail"));

    await expect(engine.executeTask(task, mockAgent, 2, tenantContext)).rejects.toThrow(
      "permanent fail",
    );
    expect(mockAgent.execute).toHaveBeenCalledTimes(2);
    expect(mockAgent.onTaskFailed).toHaveBeenCalled();
    expect(mockMemory.saveBusinessMemory).not.toHaveBeenCalled();
  });

  it("rejects a missing tenant context before any execution or persistence", async () => {
    await expect(engine.executeTask(task, mockAgent)).rejects.toThrow(
      "tenantContext.organizationId is required for task execution",
    );

    expectNoExecutionOrPersistence();
    expect(JSON.stringify(mockMemory.saveBusinessMemory.mock.calls)).not.toContain("system");
  });

  it("rejects an empty organizationId before any execution or persistence", async () => {
    await expect(
      engine.executeTask(task, mockAgent, 3, { ...tenantContext, organizationId: "" }),
    ).rejects.toThrow("tenantContext.organizationId is required for task execution");

    expectNoExecutionOrPersistence();
    expect(JSON.stringify(mockMemory.saveBusinessMemory.mock.calls)).not.toContain("system");
  });

  it("rejects a whitespace-only organizationId before any execution or persistence", async () => {
    await expect(
      engine.executeTask(task, mockAgent, 3, { ...tenantContext, organizationId: "   " }),
    ).rejects.toThrow("tenantContext.organizationId is required for task execution");

    expectNoExecutionOrPersistence();
  });
});
