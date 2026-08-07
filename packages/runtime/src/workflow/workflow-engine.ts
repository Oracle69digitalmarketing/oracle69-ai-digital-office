import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowInstance, WorkflowState } from './workflow.types.js';
import { WorkflowStateMachine } from './workflow-state-machine.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager } from './workflow-managers.js';
import { RuntimeEventType } from '../events/runtime.events.js';

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly checkpointManager: CheckpointManager,
    private readonly retryManager: RetryManager,
    private readonly compensationManager: CompensationManager,
    private readonly approvalManager: ApprovalManager
  ) {}

  async createWorkflow(planId: string, context: any): Promise<WorkflowInstance> {
    const workflow: WorkflowInstance = {
      metadata: {
        id: `wf-${Date.now()}`,
        planId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        state: WorkflowState.CREATED,
      },
      context,
      currentTaskIndex: 0,
      checkpoint: null,
      retryCount: 0,
    };
    this.emit(RuntimeEventType.WORKFLOW_CREATED, { workflowId: workflow.metadata.id });
    return workflow;
  }

  async startWorkflow(workflow: WorkflowInstance): Promise<void> {
    if (!WorkflowStateMachine.canTransition(workflow.metadata.state, WorkflowState.RUNNING)) {
        throw new Error(`Invalid transition from ${workflow.metadata.state} to RUNNING`);
    }
    workflow.metadata.state = WorkflowState.RUNNING;
    this.emit(RuntimeEventType.WORKFLOW_STARTED, { workflowId: workflow.metadata.id });
  }

  private emit(type: RuntimeEventType, payload: any): void {
    this.eventEmitter.emit(type, payload);
  }
}
