import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { WorkflowEngine } from '../../workflow/workflow-engine.js';
import { WorkflowState } from '../../workflow/workflow.types.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager } from '../../workflow/workflow-managers.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    engine = new WorkflowEngine(
      eventEmitter,
      new CheckpointManager(),
      new RetryManager(),
      new CompensationManager(),
      new ApprovalManager()
    );
  });

  it('should create a workflow', async () => {
    const workflow = await engine.createWorkflow('plan-1', {});
    expect(workflow.metadata.state).toBe(WorkflowState.CREATED);
  });

  it('should start a workflow', async () => {
    const workflow = await engine.createWorkflow('plan-1', {});
    workflow.metadata.state = WorkflowState.READY; // Force to ready for start
    await engine.startWorkflow(workflow);
    expect(workflow.metadata.state).toBe(WorkflowState.RUNNING);
  });

  it('should throw on invalid transition', async () => {
    const workflow = await engine.createWorkflow('plan-1', {});
    await expect(engine.startWorkflow(workflow)).rejects.toThrow();
  });
});
