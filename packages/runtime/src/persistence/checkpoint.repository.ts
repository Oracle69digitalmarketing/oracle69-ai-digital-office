import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";

/** Nest DI token for the {@link CheckpointRepository} contract. */
export const CHECKPOINT_REPOSITORY = "CHECKPOINT_REPOSITORY";

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
@Injectable()
export class InMemoryCheckpointRepository implements CheckpointRepository {
  private readonly checkpoints: MissionCheckpoint[] = [];

  async save(
    missionId: string,
    state: unknown,
    tenantId: string,
    version?: number,
  ): Promise<MissionCheckpoint> {
    const existing = this.checkpoints.filter(
      (c) => c.missionId === missionId && c.tenantId === tenantId,
    );
    const nextVersion =
      version ?? (existing.length > 0 ? Math.max(...existing.map((c) => c.version)) + 1 : 1);
    const checkpoint: MissionCheckpoint = {
      id: `cp-${missionId}-${nextVersion}`,
      missionId,
      version: nextVersion,
      state,
      tenantId,
      createdAt: new Date().toISOString(),
    };
    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  async latest(missionId: string, tenantId?: string): Promise<MissionCheckpoint | null> {
    const candidates = this.checkpoints.filter(
      (c) => c.missionId === missionId && (!tenantId || c.tenantId === tenantId),
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((max, c) => (c.version > max.version ? c : max));
  }

  async listForMission(missionId: string, tenantId?: string): Promise<MissionCheckpoint[]> {
    return this.checkpoints
      .filter((c) => c.missionId === missionId && (!tenantId || c.tenantId === tenantId))
      .sort((a, b) => a.version - b.version);
  }
}

/**
 * Prisma-backed checkpoint repository persisting checkpoints to the shared
 * `MissionCheckpoint` table.
 */
@Injectable()
export class PrismaCheckpointRepository implements CheckpointRepository {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available for the checkpoint repository.");
    }
    return this.prisma;
  }

  async save(
    missionId: string,
    state: unknown,
    tenantId: string,
    version?: number,
  ): Promise<MissionCheckpoint> {
    const nextVersion = version ?? (await this.nextVersion(missionId, tenantId));
    const row = await this.db.missionCheckpoint.create({
      data: {
        missionId,
        version: nextVersion,
        state: state as object,
        organizationId: tenantId,
      },
    });
    return this.fromRow(row as any);
  }

  async latest(missionId: string, tenantId?: string): Promise<MissionCheckpoint | null> {
    const row = await this.db.missionCheckpoint.findFirst({
      where: { missionId, ...(tenantId ? { organizationId: tenantId } : {}) },
      orderBy: { version: "desc" },
    });
    return row ? this.fromRow(row as any) : null;
  }

  async listForMission(missionId: string, tenantId?: string): Promise<MissionCheckpoint[]> {
    const rows = await this.db.missionCheckpoint.findMany({
      where: { missionId, ...(tenantId ? { organizationId: tenantId } : {}) },
      orderBy: { version: "asc" },
    });
    return rows.map((row: unknown) => this.fromRow(row as any));
  }

  private async nextVersion(missionId: string, tenantId: string): Promise<number> {
    const latest = await this.db.missionCheckpoint.findFirst({
      where: { missionId, organizationId: tenantId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  }

  private fromRow(row: any): MissionCheckpoint {
    return {
      id: row.id,
      missionId: row.missionId,
      version: row.version,
      state: row.state,
      tenantId: row.organizationId,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }
}
