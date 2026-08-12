import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { Mission, MissionStatus } from '../missions/mission.types.js';
import { RuntimeError } from '../errors/runtime.errors.js';

/** Nest DI token for the {@link MissionRepository} contract. */
export const MISSION_REPOSITORY = 'MISSION_REPOSITORY';

/**
 * Thrown when a mission with the same deterministic key already exists within
 * the same tenant, preventing duplicate mission creation.
 */
export class MissionConflictError extends RuntimeError {
  constructor(missionKey: string, tenantId: string) {
    super(`Mission Conflict: a mission with key '${missionKey}' already exists for tenant '${tenantId}'.`, {
      missionKey,
      tenantId,
    });
  }
}

/**
 * Durable mission repository contract.
 *
 * Implementations persist missions across process restarts and enforce tenant
 * scoping on every read and write. Mission identity within a tenant is
 * governed by the deterministic `missionKey`.
 */
export interface MissionRepository {
  /** Persists a new mission. Rejects with {@link MissionConflictError} when
   *  the same `missionKey` already exists within the tenant. */
  create(mission: Mission): Promise<Mission>;
  /** Updates an existing persisted mission. */
  update(mission: Mission): Promise<Mission>;
  /** Returns a mission by id, optionally constrained to a tenant. */
  findById(id: string, tenantId?: string): Promise<Mission | null>;
  /** Returns a mission by its deterministic key within a tenant. */
  findByMissionKey(missionKey: string, tenantId: string): Promise<Mission | null>;
  /** Lists missions for a tenant, optionally filtered by status. */
  findByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]>;
  /** Returns missions that were interrupted (running/paused/retrying) and may
   *  need recovery after a process restart. */
  findInterrupted(tenantId?: string): Promise<Mission[]>;
}

/**
 * In-memory mission repository used for tests and standalone runtimes without
 * a database connection. Enforces the same tenant-scoped duplicate prevention
 * contract as the Prisma-backed repository.
 */
@Injectable()
export class InMemoryMissionRepository implements MissionRepository {
  private readonly missions = new Map<string, Mission>();

  private clone(mission: Mission): Mission {
    return { ...mission };
  }

  async create(mission: Mission): Promise<Mission> {
    if (this.missions.has(mission.id)) {
      throw new MissionConflictError(mission.missionKey ?? mission.id, mission.tenantId);
    }
    const existing = await this.findByMissionKey(mission.missionKey ?? mission.id, mission.tenantId);
    if (existing && existing.id !== mission.id) {
      throw new MissionConflictError(mission.missionKey ?? mission.id, mission.tenantId);
    }
    const persisted: Mission = { ...this.clone(mission), version: 1 };
    this.missions.set(mission.id, persisted);
    return this.clone(persisted);
  }

  async update(mission: Mission): Promise<Mission> {
    if (!this.missions.has(mission.id)) {
      throw new RuntimeError(`Mission not found: '${mission.id}' cannot be updated.`, { missionId: mission.id });
    }
    const updated: Mission = {
      ...this.clone(mission),
      version: (mission.version ?? 0) + 1,
    };
    this.missions.set(mission.id, updated);
    return this.clone(updated);
  }

  async findById(id: string, tenantId?: string): Promise<Mission | null> {
    const mission = this.missions.get(id);
    if (!mission) return null;
    if (tenantId && mission.tenantId !== tenantId) return null;
    return this.clone(mission);
  }

  async findByMissionKey(missionKey: string, tenantId: string): Promise<Mission | null> {
    for (const mission of this.missions.values()) {
      if (mission.tenantId === tenantId && (mission.missionKey ?? mission.id) === missionKey) {
        return this.clone(mission);
      }
    }
    return null;
  }

  async findByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]> {
    return Array.from(this.missions.values())
      .filter((m) => m.tenantId === tenantId && (!status || m.status === status))
      .map((m) => this.clone(m))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async findInterrupted(tenantId?: string): Promise<Mission[]> {
    const interrupted = new Set<MissionStatus>([
      MissionStatus.RUNNING,
      MissionStatus.PAUSED,
      MissionStatus.RETRYING,
      MissionStatus.SCHEDULED,
    ]);
    return Array.from(this.missions.values())
      .filter((m) => interrupted.has(m.status) && (!tenantId || m.tenantId === tenantId))
      .map((m) => this.clone(m));
  }
}

/**
 * Prisma-backed mission repository.
 *
 * Persists missions to the shared `Mission` table using the globally provided
 * `PrismaService`. The deterministic `missionKey` + `organizationId` unique
 * constraint is enforced by the database, preventing duplicate mission
 * creation across process restarts.
 */
@Injectable()
export class PrismaMissionRepository implements MissionRepository {
  constructor(@Optional() @Inject('PrismaService') private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error('PrismaService is not available for the mission repository.');
    }
    return this.prisma;
  }

  async create(mission: Mission): Promise<Mission> {
    const missionKey = mission.missionKey ?? mission.id;
    try {
      const created = await this.db.mission.create({
        data: this.toData(mission, missionKey),
      });
      return this.fromRow(created as any);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new MissionConflictError(missionKey, mission.tenantId);
      }
      throw error;
    }
  }

  async update(mission: Mission): Promise<Mission> {
    const missionKey = mission.missionKey ?? mission.id;
    try {
      const updated = await this.db.mission.update({
        where: { id: mission.id },
        data: this.toData(mission, missionKey),
      });
      return this.fromRow(updated as any);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new MissionConflictError(missionKey, mission.tenantId);
      }
      throw error;
    }
  }

  async findById(id: string, tenantId?: string): Promise<Mission | null> {
    const row = await this.db.mission.findUnique({ where: { id } });
    if (!row) return null;
    if (tenantId && (row as any).organizationId !== tenantId) return null;
    return this.fromRow(row as any);
  }

  async findByMissionKey(missionKey: string, tenantId: string): Promise<Mission | null> {
    const row = await this.db.mission.findFirst({
      where: { missionKey, organizationId: tenantId },
    });
    return row ? this.fromRow(row as any) : null;
  }

  async findByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]> {
    const rows = await this.db.mission.findMany({
      where: {
        organizationId: tenantId,
        ...(status ? { status: status } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row: unknown) => this.fromRow(row as any));
  }

  async findInterrupted(tenantId?: string): Promise<Mission[]> {
    const rows = await this.db.mission.findMany({
      where: {
        ...(tenantId ? { organizationId: tenantId } : {}),
        status: { in: [MissionStatus.RUNNING, MissionStatus.PAUSED, MissionStatus.RETRYING, MissionStatus.SCHEDULED] },
      },
    });
    return rows.map((row: unknown) => this.fromRow(row as any));
  }

  private toData(mission: Mission, missionKey: string): any {
    return {
      goal: mission.goal,
      priority: mission.priority,
      deadline: mission.deadline ? new Date(mission.deadline) : null,
      owner: mission.owner,
      status: mission.status,
      missionKey,
      workflowId: mission.workflowId ?? null,
      planId: mission.planId ?? null,
      executionId: mission.executionId ?? null,
      correlationId: mission.correlationId ?? null,
      error: mission.error ?? null,
      state: null,
      organizationId: mission.tenantId,
    };
  }

  private fromRow(row: any): Mission {
    return {
      id: row.id,
      goal: row.goal,
      priority: row.priority as Mission['priority'],
      deadline: row.deadline ? new Date(row.deadline).toISOString() : new Date(0).toISOString(),
      owner: row.owner,
      status: row.status as MissionStatus,
      missionKey: row.missionKey ?? row.id,
      workflowId: row.workflowId ?? undefined,
      planId: row.planId ?? undefined,
      executionId: row.executionId ?? undefined,
      correlationId: row.correlationId ?? undefined,
      error: row.error ?? undefined,
      tenantId: row.organizationId,
      version: 1,
    };
  }
}
