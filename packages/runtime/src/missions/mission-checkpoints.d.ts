import { EventBus } from "../events/event-bus.js";
import { TenantContextService } from "../tenancy/tenant-context.js";
import type {
  CheckpointRepository,
  MissionCheckpoint,
} from "../persistence/checkpoint.repository.js";
/**
 * Durable mission checkpoint management.
 *
 * Checkpoints capture the execution state of a mission at a point in time and
 * are persisted through the {@link CheckpointRepository} so a mission can
 * resume from its most recent durable state after a process restart. All
 * checkpoints are tenant-scoped.
 */
export declare class MissionCheckpoints {
  private readonly eventBus;
  private readonly tenantContext?;
  private readonly logger;
  private readonly repository;
  constructor(
    eventBus: EventBus,
    tenantContext?: TenantContextService | undefined,
    repository?: CheckpointRepository,
  );
  /**
   * Persists a checkpoint for a mission and emits the canonical
   * `checkpoint.created` event.
   */
  saveCheckpoint(
    missionId: string,
    state: unknown,
    options?: {
      tenantId?: string;
      version?: number;
      idempotencyKey?: string;
    },
  ): Promise<MissionCheckpoint>;
  /**
   * Restores the most recent durable checkpoint for a mission, emitting the
   * canonical `checkpoint.restored` event.
   */
  restoreCheckpoint(
    missionId: string,
    options?: {
      tenantId?: string;
    },
  ): Promise<unknown>;
  /**
   * Lists every durable checkpoint persisted for a mission.
   */
  listCheckpoints(
    missionId: string,
    options?: {
      tenantId?: string;
    },
  ): Promise<MissionCheckpoint[]>;
  private resolveTenant;
  private emit;
}
//# sourceMappingURL=mission-checkpoints.d.ts.map
