/**
 * Enumeration of all runtime event types.
 */
export var RuntimeEventType;
(function (RuntimeEventType) {
    RuntimeEventType["RUNTIME_STARTED"] = "runtime.started";
    RuntimeEventType["RUNTIME_READY"] = "runtime.ready";
    RuntimeEventType["RUNTIME_SHUTDOWN"] = "runtime.shutdown";
    RuntimeEventType["AGENT_REGISTERED"] = "agent.registered";
    RuntimeEventType["AGENT_LOADED"] = "agent.loaded";
    RuntimeEventType["AGENT_LOOKUP"] = "agent.lookup";
    RuntimeEventType["AGENT_VALIDATION_FAILED"] = "agent.validation.failed";
    RuntimeEventType["RUNTIME_ERROR"] = "runtime.error";
    RuntimeEventType["RUNTIME_WARNING"] = "runtime.warning";
    // Planning Events
    RuntimeEventType["PLANNING_STARTED"] = "planning.started";
    RuntimeEventType["PLANNING_COMPLETED"] = "planning.completed";
    RuntimeEventType["PLANNING_FAILED"] = "planning.failed";
    RuntimeEventType["TASK_GENERATED"] = "task.generated";
    RuntimeEventType["AGENT_SELECTED"] = "agent.selected";
    RuntimeEventType["DEPENDENCY_CREATED"] = "dependency.created";
    RuntimeEventType["VALIDATION_FAILED"] = "validation.failed";
    // Workflow Events
    RuntimeEventType["WORKFLOW_CREATED"] = "workflow.created";
    RuntimeEventType["WORKFLOW_STARTED"] = "workflow.started";
    RuntimeEventType["WORKFLOW_PAUSED"] = "workflow.paused";
    RuntimeEventType["WORKFLOW_RESUMED"] = "workflow.resumed";
    RuntimeEventType["WORKFLOW_COMPLETED"] = "workflow.completed";
    RuntimeEventType["WORKFLOW_FAILED"] = "workflow.failed";
    RuntimeEventType["WORKFLOW_CANCELLED"] = "workflow.cancelled";
    RuntimeEventType["WORKFLOW_CHECKPOINT_SAVED"] = "workflow.checkpoint.saved";
    RuntimeEventType["WORKFLOW_RETRY_STARTED"] = "workflow.retry.started";
    RuntimeEventType["WORKFLOW_RETRY_COMPLETED"] = "workflow.retry.completed";
    RuntimeEventType["WORKFLOW_COMPENSATION_STARTED"] = "workflow.compensation.started";
    RuntimeEventType["WORKFLOW_COMPENSATION_COMPLETED"] = "workflow.compensation.completed";
    // Tool Events
    RuntimeEventType["TOOL_EXECUTION_STARTED"] = "tool.execution.started";
    RuntimeEventType["TOOL_EXECUTION_COMPLETED"] = "tool.execution.completed";
    RuntimeEventType["TOOL_EXECUTION_FAILED"] = "tool.execution.failed";
    RuntimeEventType["TOOL_VALIDATION_FAILED"] = "tool.validation.failed";
    RuntimeEventType["TOOL_PERMISSION_DENIED"] = "tool.permission.denied";
    RuntimeEventType["TOOL_CONNECTOR_SELECTED"] = "tool.connector.selected";
    RuntimeEventType["TOOL_CREDENTIALS_LOADED"] = "tool.credentials.loaded";
    // Mission Events
    RuntimeEventType["MISSION_CREATED"] = "mission.created";
    RuntimeEventType["MISSION_APPROVED"] = "mission.approved";
    RuntimeEventType["MISSION_STARTED"] = "mission.started";
    RuntimeEventType["MISSION_PAUSED"] = "mission.paused";
    RuntimeEventType["MISSION_RESUMED"] = "mission.resumed";
    RuntimeEventType["MISSION_COMPLETED"] = "mission.completed";
    RuntimeEventType["MISSION_CANCELLED"] = "mission.cancelled";
    RuntimeEventType["MISSION_FAILED"] = "mission.failed";
    RuntimeEventType["MISSION_RETRY_STARTED"] = "mission.retry.started";
    RuntimeEventType["MISSION_RETRY_COMPLETED"] = "mission.retry.completed";
    RuntimeEventType["MISSION_RECOVERED"] = "mission.recovered";
    RuntimeEventType["CHECKPOINT_CREATED"] = "checkpoint.created";
    RuntimeEventType["CHECKPOINT_RESTORED"] = "checkpoint.restored";
    // Memory & Observability Events
    RuntimeEventType["MEMORY_CREATED"] = "memory.created";
    RuntimeEventType["MEMORY_UPDATED"] = "memory.updated";
    RuntimeEventType["MEMORY_RETRIEVED"] = "memory.retrieved";
    RuntimeEventType["MEMORY_INDEXED"] = "memory.indexed";
    RuntimeEventType["CONTEXT_LOADED"] = "context.loaded";
    RuntimeEventType["CONTEXT_COMPRESSED"] = "context.compressed";
    RuntimeEventType["RUNTIME_HEALTH_CHANGED"] = "runtime.health.changed";
    RuntimeEventType["RUNTIME_METRIC_RECORDED"] = "runtime.metric.recorded";
    RuntimeEventType["RUNTIME_TRACE_STARTED"] = "runtime.trace.started";
    RuntimeEventType["RUNTIME_TRACE_COMPLETED"] = "runtime.trace.completed";
    RuntimeEventType["AUDIT_ENTRY_CREATED"] = "audit.entry.created";
})(RuntimeEventType || (RuntimeEventType = {}));
/**
 * Concrete implementation of a runtime event.
 */
export class RuntimeEvent {
    type;
    payload;
    timestamp;
    constructor(type, payload = {}) {
        this.type = type;
        this.payload = payload;
        this.timestamp = Date.now();
    }
}
//# sourceMappingURL=runtime.events.js.map