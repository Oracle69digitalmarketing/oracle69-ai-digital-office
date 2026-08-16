var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MissionCheckpoints_1;
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { RuntimeEventType } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';
import { TenantContextService } from '../tenancy/tenant-context.js';
import { CHECKPOINT_REPOSITORY, InMemoryCheckpointRepository } from '../persistence/checkpoint.repository.js';
/**
 * Durable mission checkpoint management.
 *
 * Checkpoints capture the execution state of a mission at a point in time and
 * are persisted through the {@link CheckpointRepository} so a mission can
 * resume from its most recent durable state after a process restart. All
 * checkpoints are tenant-scoped.
 */
let MissionCheckpoints = MissionCheckpoints_1 = class MissionCheckpoints {
    eventBus;
    tenantContext;
    logger = new Logger(MissionCheckpoints_1.name);
    repository;
    constructor(eventBus, tenantContext, repository) {
        this.eventBus = eventBus;
        this.tenantContext = tenantContext;
        this.repository = repository ?? new InMemoryCheckpointRepository();
    }
    /**
     * Persists a checkpoint for a mission and emits the canonical
     * `checkpoint.created` event.
     */
    async saveCheckpoint(missionId, state, options = {}) {
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
    async restoreCheckpoint(missionId, options = {}) {
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
    async listCheckpoints(missionId, options = {}) {
        const tenantId = this.resolveTenant(options.tenantId);
        return this.repository.listForMission(missionId, tenantId);
    }
    resolveTenant(explicit) {
        if (this.tenantContext) {
            return this.tenantContext.resolveTenantId(explicit);
        }
        return explicit ?? 'system';
    }
    emit(type, payload, options) {
        this.eventBus.publish(type, payload, {
            source: 'MissionCheckpoints',
            ...options,
        });
    }
};
MissionCheckpoints = MissionCheckpoints_1 = __decorate([
    Injectable(),
    __param(2, Optional()),
    __param(2, Inject(CHECKPOINT_REPOSITORY)),
    __metadata("design:paramtypes", [EventBus,
        TenantContextService, Object])
], MissionCheckpoints);
export { MissionCheckpoints };
