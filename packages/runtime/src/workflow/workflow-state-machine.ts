import { WorkflowState } from './workflow.types.js';

export class WorkflowStateMachine {
  private static readonly transitions: Record<WorkflowState, WorkflowState[]> = {
    [WorkflowState.CREATED]: [WorkflowState.READY],
    [WorkflowState.READY]: [WorkflowState.RUNNING, WorkflowState.CANCELLED],
    [WorkflowState.RUNNING]: [WorkflowState.COMPLETED, WorkflowState.FAILED, WorkflowState.PAUSED, WorkflowState.WAITING],
    [WorkflowState.WAITING]: [WorkflowState.RUNNING, WorkflowState.CANCELLED],
    [WorkflowState.PAUSED]: [WorkflowState.RUNNING, WorkflowState.CANCELLED],
    [WorkflowState.RETRYING]: [WorkflowState.RUNNING, WorkflowState.FAILED],
    [WorkflowState.FAILED]: [WorkflowState.RETRYING],
    [WorkflowState.COMPLETED]: [],
    [WorkflowState.CANCELLED]: [],
  };

  public static canTransition(from: WorkflowState, to: WorkflowState): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
}
