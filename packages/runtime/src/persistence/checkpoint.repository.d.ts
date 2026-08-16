import type { PrismaClient } from "@prisma/client";
/** Nest DI token for the {@link CheckpointRepository} contract. */
export declare const CHECKPOINT_REPOSITORY = "CHECKPOINT_REPOSITORY";
/**
 * A durable mission checkpoint capturing the execution state at a point in
 * time, versioned per mission so recovery can restore the most recent state.
 */
export interface MissionCheckpoint {
  readonly id: string;
  readonly missionId: string;
  /** Monotonic version of the checkpoint within the mission. */
  readonly version: number;
  /** Serialized execution state captured at the checkpoint. */
  readonly state: unknown;
  /** Tenant/organization scope of the checkpoint. */
  readonly tenantId: string;
  /** ISO timestamp of when the checkpoint was persisted. */
  readonly createdAt: string;
}
/**
 * Durable checkpoint repository contract.
 *
 * Implementations persist checkpoints across process restarts so a mission can
 * resume from its most recent durable state instead of starting over.
 */
export interface CheckpointRepository {
  /** Persists a checkpoint for a mission. */
  save(
    missionId: string,
    state: unknown,
    tenantId: string,
    version?: number,
  ): Promise<MissionCheckpoint>;
  /** Returns the most recent checkpoint for a mission. */
  latest(missionId: string, tenantId?: string): Promise<MissionCheckpoint | null>;
  /** Lists all checkpoints for a mission, oldest first. */
  listForMission(missionId: string, tenantId?: string): Promise<MissionCheckpoint[]>;
}
/**
 * In-memory checkpoint repository used for tests and standalone runtimes.
 */
export declare class InMemoryCheckpointRepository implements CheckpointRepository {
  private readonly checkpoints;
  save(
    missionId: string,
    state: unknown,
    tenantId: string,
    version?: number,
  ): Promise<MissionCheckpoint>;
  latest(missionId: string, tenantId?: string): Promise<MissionCheckpoint | null>;
  listForMission(missionId: string, tenantId?: string): Promise<MissionCheckpoint[]>;
}
/**
 * Prisma-backed checkpoint repository persisting checkpoints to the shared
 * `MissionCheckpoint` table.
 */
export declare class PrismaCheckpointRepository implements CheckpointRepository {
  private readonly prisma?;
  constructor(prisma?: PrismaClient | undefined);
  private get db();
  save(
    missionId: string,
    state: unknown,
    tenantId: string,
    version?: number,
  ): Promise<MissionCheckpoint>;
  latest(missionId: string, tenantId?: string): Promise<MissionCheckpoint | null>;
  listForMission(missionId: string, tenantId?: string): Promise<MissionCheckpoint[]>;
  private nextVersion;
  private fromRow;
}
//# sourceMappingURL=checkpoint.repository.d.ts.map
