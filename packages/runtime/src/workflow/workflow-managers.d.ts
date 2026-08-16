export declare class CheckpointManager {
  private readonly logger;
  save(workflowId: string, checkpoint: string): Promise<void>;
}
export declare class RetryManager {
  shouldRetry(retryCount: number, maxAttempts: number): Promise<boolean>;
}
export declare class CompensationManager {
  compensate(workflowId: string, task: string): Promise<void>;
}
export declare class ApprovalManager {
  requestApproval(workflowId: string, task: string): Promise<void>;
}
//# sourceMappingURL=workflow-managers.d.ts.map
