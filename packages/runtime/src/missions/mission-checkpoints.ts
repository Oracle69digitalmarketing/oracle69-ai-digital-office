import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { RuntimeEventType } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';
import { TenantContextService } from '../tenancy/tenant-context.js';
import type { CheckpointRepository, MissionCheckpoint } from '../persistence/checkpoint.repository.js';
import { CHECKPOINT_REPOSITORY, InMemoryCheckpointRepository } from '../persistence/checkpoint.repository.js';

/**
 * Durable mission checkpoint management.
 *
 * Checkpoints capture the execution state of a mission at a point in time and
 * are persisted through the {@link CheckpointRepository} so a mission can
 * resume from its most recent durable state after a process restart. All
 * checkpoints are tenant-scoped.
 */
@Injectable()
export class MissionCheckpoints {
  private readonly logger = new Logger(MissionCheckpoints.name);
  private readonly repository: CheckpointRepository;

  constructor(
    private readonly eventBus: EventBus,
    private readonly tenantContext?: TenantContextService,
    @Optional() @Inject(CHECKPOINT_REPOSITORY) repository?: CheckpointRepository
  ) {
    this.repository = repository ?? new InMemoryCheckpointRepository();
  }

  /**
   * Persists a checkpoint for a mission and emits the canonical
   * `checkpoint.created` event.
   */
  async saveCheckpoint(
    missionId: string,
    state: unknown,
    options: { tenantId?: string; version?: number; idempotencyKey?: string } = {}
  ): Promise<MissionCheckpoint> {
    const tenantId = this.resolveTenant(options.tenantId);
    const checkpoint = await this.repository.save(missionId, state, tenantId, options.version);

    this.emit(RuntimeEventType.CHECKPOINT_CREATED, {
      missionId,
      tenantId,
      version: checkpoint.version,
    }, {
      tenantId,
      missionId,
      idempotencyKey: options.idempotencyKey ?? `checkpoint.created:${missionId}:${checkpoint.version}`,
    });

    return checkpoint;
  }

  /**
   * Restores the most recent durable checkpoint for a mission, emitting the
   * canonical `checkpoint.restored` event.
   */
  async restoreCheckpoint(missionId: string, options: { tenantId?: string } = {}): Promise<unknown> {
    const tenantId = this.resolveTenant(options.tenantId);
    const checkpoint = await this.repository.latest(missionId, tenantId);

    this.emit(RuntimeEventType.CHECKPOINT_RESTORED, {
      missionId,
      tenantId,
      version: checkpoint?.version ?? 0,
      restored: checkpoint !== null,
    }, {
      tenantId,
      missionId,
    });

    return checkpoint ? checkpoint.state : undefined;
  }

  /**
   * Lists every durable checkpoint persisted for a mission.
   */
  async listCheckpoints(missionId: string, options: { tenantId?: string } = {}): Promise<MissionCheckpoint[]> {
    const tenantId = this.resolveTenant(options.tenantId);
    return this.repository.listForMission(missionId, tenantId);
  }

  private resolveTenant(explicit?: string): string {
    if (this.tenantContext) {
      return this.tenantContext.resolveTenantId(explicit);
    }
    return explicit ?? 'system';
  }

  private emit(
    type: RuntimeEventType,
    payload: Record<string, unknown>,
    options: { tenantId?: string; missionId?: string; idempotencyKey?: string }
  ): void {
    this.eventBus.publish(type, payload, {
      source: 'MissionCheckpoints',
      ...options,
    });
  }
}
