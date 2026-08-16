export enum MissionStatus {
  DRAFT = "draft",
  APPROVED = "approved",
  PLANNED = "planned",
  SCHEDULED = "scheduled",
  RUNNING = "running",
  PAUSED = "paused",
  WAITING_FOR_APPROVAL = "waiting_for_approval",
  RETRYING = "retrying",
  RECOVERED = "recovered",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
  ARCHIVED = "archived",
}

export type MissionPriority = "low" | "normal" | "high" | "critical";

/**
 * Durable mission contract.
 *
 * Every mission is tenant-scoped (`tenantId`), carries the execution
 * identifiers propagated through the canonical event pipeline and can be
 * persisted to durable storage so it survives process restarts.
 */
export interface Mission {
  /** Unique mission identifier. */
  id: string;
  /** High-level business goal the mission pursues. */
  goal: string;
  /** Business priority of the mission. */
  priority: MissionPriority;
  /** ISO timestamp of the mission deadline. */
  deadline: string;
  /** Component/agent that owns the mission. */
  owner: string;
  /** Current lifecycle status of the mission. */
  status: MissionStatus;
  /** Workflow instance created for the mission, if any. */
  workflowId?: string;
  /** Execution plan generated for the mission, if any. */
  planId?: string;
  /** Tenant/organization scope of the mission. */
  tenantId: string;
  /**
   * Deterministic key used to prevent duplicate missions within a tenant.
   * Defaults to the mission id when not provided.
   */
  missionKey?: string;
  /** Execution identifier propagated from the runtime context. */
  executionId?: string;
  /** Correlation identifier propagated from the runtime context. */
  correlationId?: string;
  /** Error message recorded when the mission failed. */
  error?: string;
  /** ISO timestamp of when the mission started. */
  startedAt?: string;
  /** ISO timestamp of when the mission completed. */
  completedAt?: string;
  /** Optimistic concurrency version, incremented on every update. */
  version?: number;
}

export interface IMissionManager {
  createMission(
    mission: Mission,
    options?: { tenantId?: string; idempotencyKey?: string },
  ): Promise<Mission>;
  startMission(missionId: string, options?: { tenantId?: string }): Promise<Mission>;
  listMissions(tenantId?: string): Promise<Mission[]>;
  getMission(missionId: string, tenantId?: string): Promise<Mission | null>;
  recoverInterrupted(tenantId?: string): Promise<Mission[]>;
}
