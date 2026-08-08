import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowInstance } from './workflow.types.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager } from './workflow-managers.js';
export declare class WorkflowEngine {
    private readonly eventEmitter;
    private readonly checkpointManager;
    private readonly retryManager;
    private readonly compensationManager;
    private readonly approvalManager;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2, checkpointManager: CheckpointManager, retryManager: RetryManager, compensationManager: CompensationManager, approvalManager: ApprovalManager);
    createWorkflow(planId: string, context: any): Promise<WorkflowInstance>;
    startWorkflow(workflow: WorkflowInstance): Promise<void>;
    private emit;
}
//# sourceMappingURL=workflow-engine.d.ts.map