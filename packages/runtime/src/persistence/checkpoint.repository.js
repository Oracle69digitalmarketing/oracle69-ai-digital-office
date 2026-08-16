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
/** Nest DI token for the {@link CheckpointRepository} contract. */
export const CHECKPOINT_REPOSITORY = 'CHECKPOINT_REPOSITORY';
/**
 * In-memory checkpoint repository used for tests and standalone runtimes.
 */
let InMemoryCheckpointRepository = class InMemoryCheckpointRepository {
    checkpoints = [];
    async save(missionId, state, tenantId, version) {
        const existing = this.checkpoints.filter((c) => c.missionId === missionId && c.tenantId === tenantId);
        const nextVersion = version ?? (existing.length > 0 ? Math.max(...existing.map((c) => c.version)) + 1 : 1);
        const checkpoint = {
            id: `cp-${missionId}-${nextVersion}`,
            missionId,
            version: nextVersion,
            state,
            tenantId,
            createdAt: new Date().toISOString(),
        };
        this.checkpoints.push(checkpoint);
        return checkpoint;
    }
    async latest(missionId, tenantId) {
        const candidates = this.checkpoints.filter((c) => c.missionId === missionId && (!tenantId || c.tenantId === tenantId));
        if (candidates.length === 0)
            return null;
        return candidates.reduce((max, c) => (c.version > max.version ? c : max));
    }
    async listForMission(missionId, tenantId) {
        return this.checkpoints
            .filter((c) => c.missionId === missionId && (!tenantId || c.tenantId === tenantId))
            .sort((a, b) => a.version - b.version);
    }
};
InMemoryCheckpointRepository = __decorate([
    Injectable()
], InMemoryCheckpointRepository);
export { InMemoryCheckpointRepository };
/**
 * Prisma-backed checkpoint repository persisting checkpoints to the shared
 * `MissionCheckpoint` table.
 */
let PrismaCheckpointRepository = class PrismaCheckpointRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get db() {
        if (!this.prisma) {
            throw new Error('PrismaService is not available for the checkpoint repository.');
        }
        return this.prisma;
    }
    async save(missionId, state, tenantId, version) {
        const nextVersion = version ?? (await this.nextVersion(missionId, tenantId));
        const row = await this.db.missionCheckpoint.create({
            data: {
                missionId,
                version: nextVersion,
                state: state,
                organizationId: tenantId,
            },
        });
        return this.fromRow(row);
    }
    async latest(missionId, tenantId) {
        const row = await this.db.missionCheckpoint.findFirst({
            where: { missionId, ...(tenantId ? { organizationId: tenantId } : {}) },
            orderBy: { version: 'desc' },
        });
        return row ? this.fromRow(row) : null;
    }
    async listForMission(missionId, tenantId) {
        const rows = await this.db.missionCheckpoint.findMany({
            where: { missionId, ...(tenantId ? { organizationId: tenantId } : {}) },
            orderBy: { version: 'asc' },
        });
        return rows.map((row) => this.fromRow(row));
    }
    async nextVersion(missionId, tenantId) {
        const latest = await this.db.missionCheckpoint.findFirst({
            where: { missionId, organizationId: tenantId },
            orderBy: { version: 'desc' },
            select: { version: true },
        });
        return (latest?.version ?? 0) + 1;
    }
    fromRow(row) {
        return {
            id: row.id,
            missionId: row.missionId,
            version: row.version,
            state: row.state,
            tenantId: row.organizationId,
            createdAt: new Date(row.createdAt).toISOString(),
        };
    }
};
PrismaCheckpointRepository = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, Inject('PrismaService')),
    __metadata("design:paramtypes", [Function])
], PrismaCheckpointRepository);
export { PrismaCheckpointRepository };
