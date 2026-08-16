import { IRuntimeEvent, IRuntimeContext } from "../runtime.types.js";
/**
 * The authoritative event vocabulary for the Enterprise Runtime.
 *
 * Every canonical runtime event is named from this catalog. Domain-specific
 * events (CRM, governance, executive, ...) extend this vocabulary through the
 * canonical envelope via `RuntimeEventType | string`.
 */
export declare enum RuntimeEventType {
  RUNTIME_STARTED = "runtime.started",
  RUNTIME_READY = "runtime.ready",
  RUNTIME_SHUTDOWN = "runtime.shutdown",
  RUNTIME_ERROR = "runtime.error",
  RUNTIME_WARNING = "runtime.warning",
  AGENT_REGISTERED = "agent.registered",
  AGENT_LOADED = "agent.loaded",
  AGENT_LOOKUP = "agent.lookup",
  AGENT_VALIDATION_FAILED = "agent.validation.failed",
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
  AUDIT_ENTRY_CREATED = "audit.entry.created",
}
/**
 * Canonical metadata attached to every runtime event envelope.
 */
export interface RuntimeEventMetadata {
  /** System component that originated the event. */
  readonly source: string;
  /** Schema version of the canonical event envelope. */
  readonly version: string;
  /** Free-form supplemental metadata. */
  readonly metadata: Record<string, unknown>;
}
/**
 * Options used to construct and publish a canonical runtime event.
 *
 * Execution context fields reuse the existing `IRuntimeContext` contract:
 * - `correlationId` is derived from `context.traceId`
 * - `tenantId` is derived from `context.orgId`
 * - `executionId` is derived from `context.taskId`
 */
export interface RuntimeEventOptions {
  /** System component that originated the event. */
  source?: string;
  /** Schema version of the canonical event envelope. */
  version?: string;
  /** Cross-system correlation identifier. */
  correlationId?: string;
  /** Identifier of the event that caused this event. */
  causationId?: string;
  /** Tenant/organization scope of the event. */
  tenantId?: string;
  /** Mission identifier when the event belongs to a mission. */
  missionId?: string;
  /** Execution/task identifier when the event belongs to an execution. */
  executionId?: string;
  /** Workflow identifier when the event belongs to a workflow. */
  workflowId?: string;
  /** Idempotency key enabling exactly-once handling by consumers/recorders. */
  idempotencyKey?: string;
  /**
   * Runtime execution context the event is published from.
   * Used to propagate correlation, tenant and execution identifiers.
   */
  context?: Pick<IRuntimeContext, "traceId" | "orgId" | "taskId">;
  /** Free-form supplemental metadata. */
  metadata?: Record<string, unknown>;
}
/**
 * Concrete implementation of a canonical runtime event.
 */
export declare class RuntimeEvent<T = unknown> implements IRuntimeEvent<T> {
  readonly type: RuntimeEventType | string;
  readonly payload: T;
  readonly eventId: string;
  readonly timestamp: number;
  readonly source: string;
  readonly version: string;
  readonly metadata: Record<string, unknown>;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly missionId?: string;
  readonly executionId?: string;
  readonly workflowId?: string;
  readonly idempotencyKey?: string;
  constructor(type: RuntimeEventType | string, payload?: T, options?: RuntimeEventOptions);
}
//# sourceMappingURL=runtime.events.d.ts.map
