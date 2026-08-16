import type { PrismaClient } from "@prisma/client";
import { Mission, MissionStatus } from "../missions/mission.types.js";
import { RuntimeError } from "../errors/runtime.errors.js";
/** Nest DI token for the {@link MissionRepository} contract. */
export declare const MISSION_REPOSITORY = "MISSION_REPOSITORY";
/**
 * Thrown when a mission with the same deterministic key already exists within
 * the same tenant, preventing duplicate mission creation.
 */
export declare class MissionConflictError extends RuntimeError {
  constructor(missionKey: string, tenantId: string);
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
export declare class InMemoryMissionRepository implements MissionRepository {
  private readonly missions;
  private clone;
  create(mission: Mission): Promise<Mission>;
  update(mission: Mission): Promise<Mission>;
  findById(id: string, tenantId?: string): Promise<Mission | null>;
  findByMissionKey(missionKey: string, tenantId: string): Promise<Mission | null>;
  findByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]>;
  findInterrupted(tenantId?: string): Promise<Mission[]>;
}
/**
 * Prisma-backed mission repository.
 *
 * Persists missions to the shared `Mission` table using the globally provided
 * `PrismaService`. The deterministic `missionKey` + `organizationId` unique
 * constraint is enforced by the database, preventing duplicate mission
 * creation across process restarts.
 */
export declare class PrismaMissionRepository implements MissionRepository {
  private readonly prisma?;
  constructor(prisma?: PrismaClient | undefined);
  private get db();
  create(mission: Mission): Promise<Mission>;
  update(mission: Mission): Promise<Mission>;
  findById(id: string, tenantId?: string): Promise<Mission | null>;
  findByMissionKey(missionKey: string, tenantId: string): Promise<Mission | null>;
  findByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]>;
  findInterrupted(tenantId?: string): Promise<Mission[]>;
  private toData;
  private fromRow;
}
//# sourceMappingURL=mission.repository.d.ts.map
