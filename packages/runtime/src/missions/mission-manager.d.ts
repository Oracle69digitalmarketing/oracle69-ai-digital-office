import { Mission, IMissionManager } from "./mission.types.js";
import { MissionRegistry } from "./mission-registry.js";
import { EventBus } from "../events/event-bus.js";
import { TenantContextService } from "../tenancy/tenant-context.js";
/**
 * Mission orchestration on top of the durable {@link MissionRegistry}.
 *
 * Responsibilities:
 * - Creates, starts, cancels and fails missions, persisting every transition
 *   through the registry so missions survive process restarts.
 * - Enforces tenant scope: every mission resolves to a tenant (explicit,
 *   mission-provided or active tenant context) and all events carry tenant,
 *   mission, execution and correlation identifiers.
 * - Prevents duplicate mission creation within a tenant through the
 *   deterministic `missionKey`.
 * - Recovers interrupted missions after a runtime restart.
 */
export declare class MissionManager implements IMissionManager {
  private readonly registry;
  private readonly eventBus;
  private readonly tenantContext?;
  private readonly logger;
  constructor(
    registry: MissionRegistry,
    eventBus: EventBus,
    tenantContext?: TenantContextService | undefined,
  );
  createMission(
    mission: Mission,
    options?: {
      tenantId?: string;
      idempotencyKey?: string;
    },
  ): Promise<Mission>;
  startMission(
    missionId: string,
    options?: {
      tenantId?: string;
    },
  ): Promise<Mission>;
  cancelMission(
    missionId: string,
    options?: {
      tenantId?: string;
    },
  ): Promise<Mission>;
  failMission(
    missionId: string,
    error: string,
    options?: {
      tenantId?: string;
    },
  ): Promise<Mission>;
  completeMission(
    missionId: string,
    options?: {
      tenantId?: string;
    },
  ): Promise<Mission>;
  getMission(missionId: string, tenantId?: string): Promise<Mission | null>;
  listMissions(tenantId?: string): Promise<Mission[]>;
  /**
   * Recovers missions interrupted by a process restart. Missions still in an
   * in-flight state are marked as recovered and re-emitted through the
   * canonical bus so operators and orchestrators can resume or abandon them.
   */
  recoverInterrupted(tenantId?: string): Promise<Mission[]>;
  private resolveTenant;
  /**
   * Resolves a mission for a tenant-scoped operation.
   *
   * The tenant is enforced when explicitly provided or when a strict
   * {@link TenantContextService} is active; otherwise the persisted mission
   * resolves its own tenant so missions created under a concrete tenant remain
   * reachable by id without a scoped context.
   */
  private resolveMission;
  private emit;
}
//# sourceMappingURL=mission-manager.d.ts.map
