import { Injectable, Logger } from "@nestjs/common";
import { Mission, MissionStatus, IMissionManager } from "./mission.types.js";
import { MissionRegistry } from "./mission-registry.js";
import { RuntimeEventType } from "../events/runtime.events.js";
import { EventBus } from "../events/event-bus.js";
import { TenantContextService } from "../tenancy/tenant-context.js";
import { MissionConflictError } from "../persistence/mission.repository.js";
import { RuntimeError } from "../errors/runtime.errors.js";

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
@Injectable()
export class MissionManager implements IMissionManager {
  private readonly logger = new Logger(MissionManager.name);

  constructor(
    private readonly registry: MissionRegistry,
    private readonly eventBus: EventBus,
    private readonly tenantContext?: TenantContextService,
  ) {}

  async createMission(
    mission: Mission,
    options: { tenantId?: string; idempotencyKey?: string } = {},
  ): Promise<Mission> {
    const tenantId = this.resolveTenant(mission.tenantId ?? options.tenantId);
    const missionKey = mission.missionKey ?? mission.id;

    const existing = await this.registry.getMission(mission.id, tenantId);
    if (existing) {
      throw new MissionConflictError(missionKey, tenantId);
    }
    const byKey = await this.registry.listByTenant(tenantId);
    if (byKey.some((m) => (m.missionKey ?? m.id) === missionKey && m.id !== mission.id)) {
      throw new MissionConflictError(missionKey, tenantId);
    }

    const created = await this.registry.registerMission({
      ...mission,
      tenantId,
      missionKey,
      status: mission.status ?? MissionStatus.DRAFT,
    });

    this.emit(
      RuntimeEventType.MISSION_CREATED,
      { missionId: created.id, tenantId, missionKey },
      {
        tenantId,
        missionId: created.id,
        executionId: created.executionId,
        correlationId: created.correlationId,
        idempotencyKey: options.idempotencyKey ?? `mission.created:${missionKey}:${tenantId}`,
      },
    );

    return created;
  }

  async startMission(missionId: string, options: { tenantId?: string } = {}): Promise<Mission> {
    const mission = await this.resolveMission(missionId, options.tenantId);
    const tenantId = mission.tenantId;
    if (mission.status === MissionStatus.RUNNING) {
      return mission;
    }

    const started = await this.registry.update({
      ...mission,
      status: MissionStatus.RUNNING,
      startedAt: mission.startedAt ?? new Date().toISOString(),
    });

    this.emit(
      RuntimeEventType.MISSION_STARTED,
      { missionId, tenantId },
      {
        tenantId,
        missionId,
        executionId: started.executionId,
        correlationId: started.correlationId,
      },
    );

    return started;
  }

  async cancelMission(missionId: string, options: { tenantId?: string } = {}): Promise<Mission> {
    const mission = await this.resolveMission(missionId, options.tenantId);
    const tenantId = mission.tenantId;
    const cancelled = await this.registry.update({ ...mission, status: MissionStatus.CANCELLED });

    this.emit(
      RuntimeEventType.MISSION_CANCELLED,
      { missionId, tenantId },
      {
        tenantId,
        missionId,
        executionId: cancelled.executionId,
        correlationId: cancelled.correlationId,
      },
    );

    return cancelled;
  }

  async failMission(
    missionId: string,
    error: string,
    options: { tenantId?: string } = {},
  ): Promise<Mission> {
    const mission = await this.resolveMission(missionId, options.tenantId);
    const tenantId = mission.tenantId;
    const failed = await this.registry.update({ ...mission, status: MissionStatus.FAILED, error });

    this.emit(
      RuntimeEventType.MISSION_FAILED,
      { missionId, tenantId, error },
      {
        tenantId,
        missionId,
        executionId: failed.executionId,
        correlationId: failed.correlationId,
      },
    );

    return failed;
  }

  async completeMission(missionId: string, options: { tenantId?: string } = {}): Promise<Mission> {
    const mission = await this.resolveMission(missionId, options.tenantId);
    const tenantId = mission.tenantId;
    const completed = await this.registry.update({
      ...mission,
      status: MissionStatus.COMPLETED,
      completedAt: new Date().toISOString(),
    });

    this.emit(
      RuntimeEventType.MISSION_COMPLETED,
      { missionId, tenantId },
      {
        tenantId,
        missionId,
        executionId: completed.executionId,
        correlationId: completed.correlationId,
      },
    );

    return completed;
  }

  async getMission(missionId: string, tenantId?: string): Promise<Mission | null> {
    const resolvedTenant = this.tenantContext
      ? this.tenantContext.resolveTenantId(tenantId)
      : (tenantId ?? undefined);
    return this.registry.getMission(missionId, resolvedTenant ?? undefined);
  }

  async listMissions(tenantId?: string): Promise<Mission[]> {
    const resolvedTenant = this.resolveTenant(tenantId);
    return this.registry.listByTenant(resolvedTenant);
  }

  /**
   * Recovers missions interrupted by a process restart. Missions still in an
   * in-flight state are marked as recovered and re-emitted through the
   * canonical bus so operators and orchestrators can resume or abandon them.
   */
  async recoverInterrupted(tenantId?: string): Promise<Mission[]> {
    let resolvedTenant: string | undefined = tenantId;
    if (this.tenantContext && !tenantId) {
      try {
        resolvedTenant = this.tenantContext.resolveTenantId(undefined);
      } catch (e) {
        // Allow global recovery when no tenant context is active
        resolvedTenant = undefined;
      }
    }
    const interrupted = await this.registry.findInterrupted(resolvedTenant);

    const recovered: Mission[] = [];
    for (const mission of interrupted) {
      const updated = await this.registry.update({ ...mission, status: MissionStatus.RECOVERED });
      this.emit(
        RuntimeEventType.MISSION_RECOVERED,
        { missionId: updated.id, tenantId: updated.tenantId },
        {
          tenantId: updated.tenantId,
          missionId: updated.id,
          executionId: updated.executionId,
          correlationId: updated.correlationId,
        },
      );
      recovered.push(updated);
    }

    if (recovered.length > 0) {
      this.logger.log(`Recovered ${recovered.length} interrupted mission(s).`);
    }
    return recovered;
  }

  private resolveTenant(explicit?: string): string {
    if (this.tenantContext) {
      return this.tenantContext.resolveTenantId(explicit);
    }
    return explicit ?? "system";
  }

  /**
   * Resolves a mission for a tenant-scoped operation.
   *
   * The tenant is enforced when explicitly provided or when a strict
   * {@link TenantContextService} is active; otherwise the persisted mission
   * resolves its own tenant so missions created under a concrete tenant remain
   * reachable by id without a scoped context.
   */
  private async resolveMission(missionId: string, explicitTenant?: string): Promise<Mission> {
    if (explicitTenant) {
      const scoped = await this.registry.getMission(missionId, explicitTenant);
      if (!scoped) {
        throw new RuntimeError(`Mission not found: '${missionId}' in tenant '${explicitTenant}'.`, {
          missionId,
          tenantId: explicitTenant,
        });
      }
      return scoped;
    }
    if (this.tenantContext) {
      const tenantId = this.tenantContext.resolveTenantId();
      const scoped = await this.registry.getMission(missionId, tenantId);
      if (!scoped) {
        throw new RuntimeError(`Mission not found: '${missionId}' in tenant '${tenantId}'.`, {
          missionId,
          tenantId,
        });
      }
      return scoped;
    }
    const mission = await this.registry.getMission(missionId);
    if (!mission) {
      throw new RuntimeError(`Mission not found: '${missionId}'.`, { missionId });
    }
    return mission;
  }

  private emit(
    type: RuntimeEventType,
    payload: Record<string, unknown>,
    options: {
      tenantId?: string;
      missionId?: string;
      executionId?: string;
      correlationId?: string;
      idempotencyKey?: string;
    },
  ): void {
    this.eventBus.publish(type, payload, {
      source: "MissionManager",
      ...options,
    });
  }
}
