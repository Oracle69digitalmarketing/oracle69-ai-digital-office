import { WorkflowState } from './workflow.types.js';
export class WorkflowStateMachine {
    static transitions = {
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
    static canTransition(from, to) {
        return this.transitions[from]?.includes(to) ?? false;
    }
}
