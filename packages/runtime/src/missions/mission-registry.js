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
import { Inject, Injectable } from '@nestjs/common';
import { MISSION_REPOSITORY } from '../persistence/mission.repository.js';
/**
 * Tenant-scoped mission registry backed by the durable
 * {@link MissionRepository}.
 *
 * The registry is the in-memory surface for mission lookups while all writes
 * flow through the repository so missions survive process restarts.
 */
let MissionRegistry = class MissionRegistry {
    repository;
    cache = new Map();
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Persists a mission. Rejects duplicates within the same tenant.
     */
    async registerMission(mission) {
        const persisted = await this.repository.create(mission);
        this.cache.set(persisted.id, persisted);
        return persisted;
    }
    /**
     * Updates a persisted mission and refreshes the local cache.
     */
    async update(mission) {
        const persisted = await this.repository.update(mission);
        this.cache.set(persisted.id, persisted);
        return persisted;
    }
    /**
     * Returns a mission by id, optionally constrained to a tenant.
     */
    async getMission(id, tenantId) {
        const cached = this.cache.get(id);
        if (cached) {
            return tenantId && cached.tenantId !== tenantId ? null : cached;
        }
        return this.repository.findById(id, tenantId);
    }
    /**
     * Lists every mission for a tenant, optionally filtered by status.
     */
    async listByTenant(tenantId, status) {
        return this.repository.findByTenant(tenantId, status);
    }
    /**
     * Returns missions that were interrupted and may need recovery.
     */
    async findInterrupted(tenantId) {
        return this.repository.findInterrupted(tenantId);
    }
    /**
     * Clears the local cache (e.g. after a restart the repository is the
     * source of truth).
     */
    clearCache() {
        this.cache.clear();
    }
};
MissionRegistry = __decorate([
    Injectable(),
    __param(0, Inject(MISSION_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], MissionRegistry);
export { MissionRegistry };
