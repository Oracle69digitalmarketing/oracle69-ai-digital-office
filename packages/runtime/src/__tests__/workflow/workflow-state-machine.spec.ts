import { WorkflowStateMachine } from '../../workflow/workflow-state-machine.js';
import { WorkflowState } from '../../workflow/workflow.types.js';

describe('WorkflowStateMachine', () => {
  it('should allow valid transitions', () => {
    expect(WorkflowStateMachine.canTransition(WorkflowState.CREATED, WorkflowState.READY)).toBe(true);
    expect(WorkflowStateMachine.canTransition(WorkflowState.READY, WorkflowState.RUNNING)).toBe(true);
  });

  it('should deny invalid transitions', () => {
    expect(WorkflowStateMachine.canTransition(WorkflowState.CREATED, WorkflowState.RUNNING)).toBe(false);
    expect(WorkflowStateMachine.canTransition(WorkflowState.COMPLETED, WorkflowState.RUNNING)).toBe(false);
  });
});
