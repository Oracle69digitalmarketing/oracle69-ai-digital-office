import { Mission, MissionStatus } from "./mission.types.js";
import type { MissionRepository } from "../persistence/mission.repository.js";
/**
 * Tenant-scoped mission registry backed by the durable
 * {@link MissionRepository}.
 *
 * The registry is the in-memory surface for mission lookups while all writes
 * flow through the repository so missions survive process restarts.
 */
export declare class MissionRegistry {
  private readonly repository;
  private readonly cache;
  constructor(repository: MissionRepository);
  /**
   * Persists a mission. Rejects duplicates within the same tenant.
   */
  registerMission(mission: Mission): Promise<Mission>;
  /**
   * Updates a persisted mission and refreshes the local cache.
   */
  update(mission: Mission): Promise<Mission>;
  /**
   * Returns a mission by id, optionally constrained to a tenant.
   */
  getMission(id: string, tenantId?: string): Promise<Mission | null>;
  /**
   * Lists every mission for a tenant, optionally filtered by status.
   */
  listByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]>;
  /**
   * Returns missions that were interrupted and may need recovery.
   */
  findInterrupted(tenantId?: string): Promise<Mission[]>;
  /**
   * Clears the local cache (e.g. after a restart the repository is the
   * source of truth).
   */
  clearCache(): void;
}
//# sourceMappingURL=mission-registry.d.ts.map
