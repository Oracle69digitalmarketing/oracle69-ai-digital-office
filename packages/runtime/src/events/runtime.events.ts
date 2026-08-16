import { v4 as uuidv4 } from "uuid";
import { IRuntimeEvent, IRuntimeContext } from "../runtime.types.js";

/**
 * The authoritative event vocabulary for the Enterprise Runtime.
 *
 * Every canonical runtime event is named from this catalog. Domain-specific
 * events (CRM, governance, executive, ...) extend this vocabulary through the
 * canonical envelope via `RuntimeEventType | string`.
 */
export enum RuntimeEventType {
  // Runtime Events
  RUNTIME_STARTED = "runtime.started",
  RUNTIME_READY = "runtime.ready",
  RUNTIME_SHUTDOWN = "runtime.shutdown",
  RUNTIME_ERROR = "runtime.error",
  RUNTIME_WARNING = "runtime.warning",

  // Agent Events
  AGENT_REGISTERED = "agent.registered",
  AGENT_LOADED = "agent.loaded",
  AGENT_LOOKUP = "agent.lookup",
  AGENT_VALIDATION_FAILED = "agent.validation.failed",

  // Planning Events
  PLANNING_STARTED = "planning.started",
  PLANNING_COMPLETED = "planning.completed",
  PLANNING_FAILED = "planning.failed",
  TASK_GENERATED = "task.generated",
  AGENT_SELECTED = "agent.selected",
  DEPENDENCY_CREATED = "dependency.created",
  VALIDATION_FAILED = "validation.failed",

  // Workflow Events
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

  // Tool Events
  TOOL_EXECUTION_STARTED = "tool.execution.started",
  TOOL_EXECUTION_COMPLETED = "tool.execution.completed",
  TOOL_EXECUTION_FAILED = "tool.execution.failed",
  TOOL_VALIDATION_FAILED = "tool.validation.failed",
  TOOL_PERMISSION_DENIED = "tool.permission.denied",
  TOOL_CONNECTOR_SELECTED = "tool.connector.selected",
  TOOL_CREDENTIALS_LOADED = "tool.credentials.loaded",

  // Mission Events
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

  // Memory & Observability Events
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
export class RuntimeEvent<T = unknown> implements IRuntimeEvent<T> {
  public readonly eventId: string;
  public readonly timestamp: number;
  public readonly source: string;
  public readonly version: string;
  public readonly metadata: Record<string, unknown>;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly tenantId?: string;
  public readonly missionId?: string;
  public readonly executionId?: string;
  public readonly workflowId?: string;
  public readonly idempotencyKey?: string;

  constructor(
    public readonly type: RuntimeEventType | string,
    public readonly payload: T = {} as T,
    options: RuntimeEventOptions = {},
  ) {
    this.eventId = uuidv4();
    this.timestamp = Date.now();
    this.source = options.source ?? "runtime";
    this.version = options.version ?? "1.0.0";
    this.metadata = options.metadata ?? {};

    // Correlation / execution context propagation reuses IRuntimeContext.
    this.correlationId = options.correlationId ?? options.context?.traceId;
    this.tenantId = options.tenantId ?? options.context?.orgId;
    this.executionId = options.executionId ?? options.context?.taskId;
    this.causationId = options.causationId;
    this.missionId = options.missionId;
    this.workflowId = options.workflowId;
    this.idempotencyKey = options.idempotencyKey;
  }
}
