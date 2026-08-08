import { IRuntimeContext } from '../runtime.types.js';
/**
 * Supported task execution types.
 */
export declare enum TaskType {
    SEQUENTIAL = "sequential",
    PARALLEL = "parallel",
    CONDITIONAL = "conditional",
    APPROVAL = "approval"
}
/**
 * Definition of a single task within an execution plan.
 */
export interface TaskDefinition {
    /** Unique task identifier */
    id: string;
    /** Execution pattern */
    type: TaskType;
    /** Human-readable objective for the agent */
    objective: string;
    /** Role of the agent required for this task */
    role: string;
    /** Specific agent ID if pre-assigned */
    agentId?: string;
    /** Required capabilities for agent matching */
    requiredCapabilities?: string[];
    /** Required tools for agent matching */
    requiredTools?: string[];
    /** IDs of tasks that must complete before this one starts */
    dependencies: string[];
    /** Strategy for handling transient failures */
    retryPolicy?: RetryPolicy;
    /** Task to execute if this one fails and needs reversal */
    compensationTask?: string;
    /** Branching logic for CONDITIONAL tasks */
    condition?: {
        expression: string;
        nextTasks: Record<string, string>;
    };
}
/**
 * Configuration for task retries.
 */
export interface RetryPolicy {
    maxAttempts: number;
    backoff: 'fixed' | 'exponential';
    delayMs: number;
}
/**
 * A deterministic DAG of tasks to achieve a specific goal.
 */
export interface ExecutionPlan {
    /** The high-level objective */
    goal: string;
    /** Map of taskId to TaskDefinition */
    tasks: Map<string, TaskDefinition>;
    /** Metadata for tracing and debugging */
    metadata: {
        createdAt: string;
        version: string;
        traceId: string;
        orgId: string;
    };
}
/**
 * Interface for the Enterprise Planning Engine.
 */
export interface IPlanningEngine {
    /**
     * Transforms a goal into a deterministic execution plan.
     * @param goal The business goal.
     * @param context The current execution context.
     */
    generatePlan(goal: string, context: IRuntimeContext): Promise<ExecutionPlan>;
    /**
     * Validates if a plan is executable (e.g. no cycles, agents available).
     * @param plan The plan to validate.
     */
    validatePlan(plan: ExecutionPlan): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
//# sourceMappingURL=planner.types.d.ts.map