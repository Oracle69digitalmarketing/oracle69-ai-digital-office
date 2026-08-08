import { IRuntimeEvent } from '../runtime.types.js';
/**
 * Enumeration of all runtime event types.
 */
export declare enum RuntimeEventType {
    RUNTIME_STARTED = "runtime.started",
    RUNTIME_READY = "runtime.ready",
    RUNTIME_SHUTDOWN = "runtime.shutdown",
    AGENT_REGISTERED = "agent.registered",
    AGENT_LOADED = "agent.loaded",
    AGENT_LOOKUP = "agent.lookup",
    AGENT_VALIDATION_FAILED = "agent.validation.failed",
    RUNTIME_ERROR = "runtime.error",
    RUNTIME_WARNING = "runtime.warning",
    PLANNING_STARTED = "planning.started",
    PLANNING_COMPLETED = "planning.completed",
    PLANNING_FAILED = "planning.failed",
    TASK_GENERATED = "task.generated",
    AGENT_SELECTED = "agent.selected",
    DEPENDENCY_CREATED = "dependency.created",
    VALIDATION_FAILED = "validation.failed",
    WORKFLOW_CREATED = "workflow.created",
    WORKFLOW_STARTED = "workflow.started",
    WORKFLOW_PAUSED = "workflow.paused",
    WORKFLOW_RESUMED = "workflow.resumed",
    WORKFLOW_COMPLETED = "workflow.completed",
    WORKFLOW_FAILED = "workflow.failed",
    WORKFLOW_CANCELLED = "workflow.cancelled",
    WORKFLOW_CHECKPOINT_SAVED = "workflow.checkpoint.saved",
    WORKFLOW_RETRY_STARTED = "workflow.retry.started",
    WORKFLOW_RETRY_COMPLETED = "workflow.retry.completed",
    WORKFLOW_COMPENSATION_STARTED = "workflow.compensation.started",
    WORKFLOW_COMPENSATION_COMPLETED = "workflow.compensation.completed",
    TOOL_EXECUTION_STARTED = "tool.execution.started",
    TOOL_EXECUTION_COMPLETED = "tool.execution.completed",
    TOOL_EXECUTION_FAILED = "tool.execution.failed",
    TOOL_VALIDATION_FAILED = "tool.validation.failed",
    TOOL_PERMISSION_DENIED = "tool.permission.denied",
    TOOL_CONNECTOR_SELECTED = "tool.connector.selected",
    TOOL_CREDENTIALS_LOADED = "tool.credentials.loaded",
    MISSION_CREATED = "mission.created",
    MISSION_APPROVED = "mission.approved",
    MISSION_STARTED = "mission.started",
    MISSION_PAUSED = "mission.paused",
    MISSION_RESUMED = "mission.resumed",
    MISSION_COMPLETED = "mission.completed",
    MISSION_CANCELLED = "mission.cancelled",
    MISSION_FAILED = "mission.failed",
    MISSION_RETRY_STARTED = "mission.retry.started",
    MISSION_RETRY_COMPLETED = "mission.retry.completed",
    MISSION_RECOVERED = "mission.recovered",
    CHECKPOINT_CREATED = "checkpoint.created",
    CHECKPOINT_RESTORED = "checkpoint.restored",
    MEMORY_CREATED = "memory.created",
    MEMORY_UPDATED = "memory.updated",
    MEMORY_RETRIEVED = "memory.retrieved",
    MEMORY_INDEXED = "memory.indexed",
    CONTEXT_LOADED = "context.loaded",
    CONTEXT_COMPRESSED = "context.compressed",
    RUNTIME_HEALTH_CHANGED = "runtime.health.changed",
    RUNTIME_METRIC_RECORDED = "runtime.metric.recorded",
    RUNTIME_TRACE_STARTED = "runtime.trace.started",
    RUNTIME_TRACE_COMPLETED = "runtime.trace.completed",
    AUDIT_ENTRY_CREATED = "audit.entry.created"
}
/**
 * Concrete implementation of a runtime event.
 */
export declare class RuntimeEvent implements IRuntimeEvent {
    readonly type: RuntimeEventType | string;
    readonly payload: any;
    readonly timestamp: number;
    constructor(type: RuntimeEventType | string, payload?: any);
}
//# sourceMappingURL=runtime.events.d.ts.map