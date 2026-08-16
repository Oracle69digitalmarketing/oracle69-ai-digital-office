import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { WorkflowEngine } from "../../workflow/workflow-engine.js";
import { WorkflowState } from "../../workflow/workflow.types.js";
import {
  CheckpointManager,
  RetryManager,
  CompensationManager,
  ApprovalManager,
} from "../../workflow/workflow-managers.js";
import { EventBus } from "../../events/event-bus.js";
import { RuntimeEventType } from "../../events/runtime.events.js";

describe("WorkflowEngine", () => {
  let engine: WorkflowEngine;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    engine = new WorkflowEngine(
      eventBus,
      new CheckpointManager(),
      new RetryManager(),
      new CompensationManager(),
      new ApprovalManager(),
    );
  });

  it("should create a workflow", async () => {
    const workflow = await engine.createWorkflow("plan-1", {});
    expect(workflow.metadata.state).toBe(WorkflowState.CREATED);
  });

  it("should start a workflow", async () => {
    const workflow = await engine.createWorkflow("plan-1", {});
    workflow.metadata.state = WorkflowState.READY; // Force to ready for start
    await engine.startWorkflow(workflow);
    expect(workflow.metadata.state).toBe(WorkflowState.RUNNING);
  });

  it("should throw on invalid transition", async () => {
    const workflow = await engine.createWorkflow("plan-1", {});
    await expect(engine.startWorkflow(workflow)).rejects.toThrow();
  });

  it("should publish workflow events through the canonical EventBus", async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    const workflow = await engine.createWorkflow("plan-1", {});
    workflow.metadata.state = WorkflowState.READY;
    await engine.startWorkflow(workflow);

    expect(published).toContain(RuntimeEventType.WORKFLOW_CREATED);
    expect(published).toContain(RuntimeEventType.WORKFLOW_STARTED);
  });
});
