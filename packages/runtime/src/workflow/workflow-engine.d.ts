import { WorkflowInstance } from "./workflow.types.js";
import {
  CheckpointManager,
  RetryManager,
  CompensationManager,
  ApprovalManager,
} from "./workflow-managers.js";
import { EventBus } from "../events/event-bus.js";
export declare class WorkflowEngine {
  private readonly eventBus;
  private readonly checkpointManager;
  private readonly retryManager;
  private readonly compensationManager;
  private readonly approvalManager;
  private readonly logger;
  constructor(
    eventBus: EventBus,
    checkpointManager: CheckpointManager,
    retryManager: RetryManager,
    compensationManager: CompensationManager,
    approvalManager: ApprovalManager,
  );
  createWorkflow(planId: string, context: any): Promise<WorkflowInstance>;
  startWorkflow(workflow: WorkflowInstance): Promise<void>;
  private emit;
}
//# sourceMappingURL=workflow-engine.d.ts.map
