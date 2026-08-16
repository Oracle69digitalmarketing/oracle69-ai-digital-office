import { Inject, Injectable } from "@nestjs/common";
import { Mission, MissionStatus } from "./mission.types.js";
import type { MissionRepository } from "../persistence/mission.repository.js";
import { MISSION_REPOSITORY } from "../persistence/mission.repository.js";

/**
 * Tenant-scoped mission registry backed by the durable
 * {@link MissionRepository}.
 *
 * The registry is the in-memory surface for mission lookups while all writes
 * flow through the repository so missions survive process restarts.
 */
@Injectable()
export class MissionRegistry {
  private readonly cache = new Map<string, Mission>();

  constructor(@Inject(MISSION_REPOSITORY) private readonly repository: MissionRepository) {}

  /**
   * Persists a mission. Rejects duplicates within the same tenant.
   */
  async registerMission(mission: Mission): Promise<Mission> {
    const persisted = await this.repository.create(mission);
    this.cache.set(persisted.id, persisted);
    return persisted;
  }

  /**
   * Updates a persisted mission and refreshes the local cache.
   */
  async update(mission: Mission): Promise<Mission> {
    const persisted = await this.repository.update(mission);
    this.cache.set(persisted.id, persisted);
    return persisted;
  }

  /**
   * Returns a mission by id, optionally constrained to a tenant.
   */
  async getMission(id: string, tenantId?: string): Promise<Mission | null> {
    const cached = this.cache.get(id);
    if (cached) {
      return tenantId && cached.tenantId !== tenantId ? null : cached;
    }
    return this.repository.findById(id, tenantId);
  }

  /**
   * Lists every mission for a tenant, optionally filtered by status.
   */
  async listByTenant(tenantId: string, status?: MissionStatus): Promise<Mission[]> {
    return this.repository.findByTenant(tenantId, status);
  }

  /**
   * Returns missions that were interrupted and may need recovery.
   */
  async findInterrupted(tenantId?: string): Promise<Mission[]> {
    return this.repository.findInterrupted(tenantId);
  }

  /**
   * Clears the local cache (e.g. after a restart the repository is the
   * source of truth).
   */
  clearCache(): void {
    this.cache.clear();
  }
}
