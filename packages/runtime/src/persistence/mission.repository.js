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
import { Inject, Injectable, Optional } from '@nestjs/common';
import { MissionStatus } from '../missions/mission.types.js';
import { RuntimeError } from '../errors/runtime.errors.js';
/** Nest DI token for the {@link MissionRepository} contract. */
export const MISSION_REPOSITORY = 'MISSION_REPOSITORY';
/**
 * Thrown when a mission with the same deterministic key already exists within
 * the same tenant, preventing duplicate mission creation.
 */
export class MissionConflictError extends RuntimeError {
    constructor(missionKey, tenantId) {
        super(`Mission Conflict: a mission with key '${missionKey}' already exists for tenant '${tenantId}'.`, {
            missionKey,
            tenantId,
        });
    }
}
/**
 * In-memory mission repository used for tests and standalone runtimes without
 * a database connection. Enforces the same tenant-scoped duplicate prevention
 * contract as the Prisma-backed repository.
 */
let InMemoryMissionRepository = class InMemoryMissionRepository {
    missions = new Map();
    clone(mission) {
        return { ...mission };
    }
    async create(mission) {
        if (this.missions.has(mission.id)) {
            throw new MissionConflictError(mission.missionKey ?? mission.id, mission.tenantId);
        }
        const existing = await this.findByMissionKey(mission.missionKey ?? mission.id, mission.tenantId);
        if (existing && existing.id !== mission.id) {
            throw new MissionConflictError(mission.missionKey ?? mission.id, mission.tenantId);
        }
        const persisted = { ...this.clone(mission), version: 1 };
        this.missions.set(mission.id, persisted);
        return this.clone(persisted);
    }
    async update(mission) {
        if (!this.missions.has(mission.id)) {
            throw new RuntimeError(`Mission not found: '${mission.id}' cannot be updated.`, { missionId: mission.id });
        }
        const updated = {
            ...this.clone(mission),
            version: (mission.version ?? 0) + 1,
        };
        this.missions.set(mission.id, updated);
        return this.clone(updated);
    }
    async findById(id, tenantId) {
        const mission = this.missions.get(id);
        if (!mission)
            return null;
        if (tenantId && mission.tenantId !== tenantId)
            return null;
        return this.clone(mission);
    }
    async findByMissionKey(missionKey, tenantId) {
        for (const mission of this.missions.values()) {
            if (mission.tenantId === tenantId && (mission.missionKey ?? mission.id) === missionKey) {
                return this.clone(mission);
            }
        }
        return null;
    }
    async findByTenant(tenantId, status) {
        return Array.from(this.missions.values())
            .filter((m) => m.tenantId === tenantId && (!status || m.status === status))
            .map((m) => this.clone(m))
            .sort((a, b) => a.id.localeCompare(b.id));
    }
    async findInterrupted(tenantId) {
        const interrupted = new Set([
            MissionStatus.RUNNING,
            MissionStatus.PAUSED,
            MissionStatus.RETRYING,
            MissionStatus.SCHEDULED,
        ]);
        return Array.from(this.missions.values())
            .filter((m) => interrupted.has(m.status) && (!tenantId || m.tenantId === tenantId))
            .map((m) => this.clone(m));
    }
};
InMemoryMissionRepository = __decorate([
    Injectable()
], InMemoryMissionRepository);
export { InMemoryMissionRepository };
/**
 * Prisma-backed mission repository.
 *
 * Persists missions to the shared `Mission` table using the globally provided
 * `PrismaService`. The deterministic `missionKey` + `organizationId` unique
 * constraint is enforced by the database, preventing duplicate mission
 * creation across process restarts.
 */
let PrismaMissionRepository = class PrismaMissionRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get db() {
        if (!this.prisma) {
            throw new Error('PrismaService is not available for the mission repository.');
        }
        return this.prisma;
    }
    async create(mission) {
        const missionKey = mission.missionKey ?? mission.id;
        try {
            const created = await this.db.mission.create({
                data: this.toData(mission, missionKey),
            });
            return this.fromRow(created);
        }
        catch (error) {
            if (error?.code === 'P2002') {
                throw new MissionConflictError(missionKey, mission.tenantId);
            }
            throw error;
        }
    }
    async update(mission) {
        const missionKey = mission.missionKey ?? mission.id;
        try {
            const updated = await this.db.mission.update({
                where: { id: mission.id },
                data: this.toData(mission, missionKey),
            });
            return this.fromRow(updated);
        }
        catch (error) {
            if (error?.code === 'P2002') {
                throw new MissionConflictError(missionKey, mission.tenantId);
            }
            throw error;
        }
    }
    async findById(id, tenantId) {
        const row = await this.db.mission.findUnique({ where: { id } });
        if (!row)
            return null;
        if (tenantId && row.organizationId !== tenantId)
            return null;
        return this.fromRow(row);
    }
    async findByMissionKey(missionKey, tenantId) {
        const row = await this.db.mission.findFirst({
            where: { missionKey, organizationId: tenantId },
        });
        return row ? this.fromRow(row) : null;
    }
    async findByTenant(tenantId, status) {
        const rows = await this.db.mission.findMany({
            where: {
                organizationId: tenantId,
                ...(status ? { status: status } : {}),
            },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((row) => this.fromRow(row));
    }
    async findInterrupted(tenantId) {
        const rows = await this.db.mission.findMany({
            where: {
                ...(tenantId ? { organizationId: tenantId } : {}),
                status: { in: [MissionStatus.RUNNING, MissionStatus.PAUSED, MissionStatus.RETRYING, MissionStatus.SCHEDULED] },
            },
        });
        return rows.map((row) => this.fromRow(row));
    }
    toData(mission, missionKey) {
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
    fromRow(row) {
        return {
            id: row.id,
            goal: row.goal,
            priority: row.priority,
            deadline: row.deadline ? new Date(row.deadline).toISOString() : new Date(0).toISOString(),
            owner: row.owner,
            status: row.status,
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
};
PrismaMissionRepository = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, Inject('PrismaService')),
    __metadata("design:paramtypes", [Function])
], PrismaMissionRepository);
export { PrismaMissionRepository };
