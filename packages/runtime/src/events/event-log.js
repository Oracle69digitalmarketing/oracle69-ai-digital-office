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
/** Nest DI token for the {@link EventLog} contract. */
export const EVENT_LOG = 'EVENT_LOG';
/**
 * In-memory event log used for tests and for standalone runtimes without a
 * database connection. Records are deduplicated by idempotency key.
 */
let InMemoryEventLog = class InMemoryEventLog {
    records = [];
    byIdempotency = new Map();
    toRecord(event) {
        return {
            id: event.eventId,
            eventId: event.eventId,
            type: event.type,
            payload: event.payload,
            source: event.source,
            version: event.version,
            correlationId: event.correlationId,
            causationId: event.causationId,
            tenantId: event.tenantId,
            missionId: event.missionId,
            executionId: event.executionId,
            workflowId: event.workflowId,
            idempotencyKey: event.idempotencyKey,
            metadata: event.metadata ?? {},
            timestamp: event.timestamp,
        };
    }
    async write(event) {
        if (event.idempotencyKey) {
            const existingId = this.byIdempotency.get(event.idempotencyKey);
            if (existingId && this.records.some((r) => r.eventId === existingId)) {
                return;
            }
            this.byIdempotency.set(event.idempotencyKey, event.eventId);
        }
        if (this.records.some((r) => r.eventId === event.eventId)) {
            return;
        }
        this.records.push(this.toRecord(event));
    }
    async findById(eventId) {
        return this.records.find((r) => r.eventId === eventId) ?? null;
    }
    async findByIdempotencyKey(idempotencyKey) {
        const eventId = this.byIdempotency.get(idempotencyKey);
        if (!eventId)
            return null;
        return this.records.find((r) => r.eventId === eventId) ?? null;
    }
    async findByTenant(tenantId, query = {}) {
        return this.query(tenantId, query);
    }
    async count(query = {}) {
        return this.query(query.tenantId, query).length;
    }
    query(tenantId, query) {
        let records = this.records;
        if (tenantId) {
            records = records.filter((r) => r.tenantId === tenantId);
        }
        if (query.type)
            records = records.filter((r) => r.type === query.type);
        if (query.correlationId)
            records = records.filter((r) => r.correlationId === query.correlationId);
        if (query.missionId)
            records = records.filter((r) => r.missionId === query.missionId);
        if (query.executionId)
            records = records.filter((r) => r.executionId === query.executionId);
        const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
        const offset = query.offset ?? 0;
        const limit = query.limit ?? sorted.length;
        return sorted.slice(offset, offset + limit);
    }
};
InMemoryEventLog = __decorate([
    Injectable()
], InMemoryEventLog);
export { InMemoryEventLog };
/**
 * Prisma-backed persistent event log.
 *
 * Persists every canonical event to the shared `RuntimeEventLog` table using
 * the globally provided `PrismaService`. Safe to register as an
 * {@link EventLogSink} on the canonical {@link EventBus}.
 */
let PrismaEventLog = class PrismaEventLog {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get db() {
        if (!this.prisma) {
            throw new Error('PrismaService is not available for the persistent EventLog.');
        }
        return this.prisma;
    }
    async write(event) {
        await this.db.runtimeEventLog.upsert({
            where: { eventId: event.eventId },
            create: {
                eventId: event.eventId,
                type: event.type,
                payload: event.payload,
                source: event.source,
                version: event.version,
                correlationId: event.correlationId ?? null,
                causationId: event.causationId ?? null,
                tenantId: event.tenantId ?? null,
                missionId: event.missionId ?? null,
                executionId: event.executionId ?? null,
                workflowId: event.workflowId ?? null,
                idempotencyKey: event.idempotencyKey ?? null,
                metadata: (event.metadata ?? {}),
                timestamp: new Date(event.timestamp),
            },
            update: {},
        });
    }
    async findById(eventId) {
        const row = await this.db.runtimeEventLog.findUnique({ where: { eventId } });
        return row ? this.fromRow(row) : null;
    }
    async findByIdempotencyKey(idempotencyKey) {
        const row = await this.db.runtimeEventLog.findUnique({ where: { idempotencyKey } });
        return row ? this.fromRow(row) : null;
    }
    async findByTenant(tenantId, query = {}) {
        const rows = await this.db.runtimeEventLog.findMany({
            where: {
                tenantId,
                ...(query.type ? { type: query.type } : {}),
                ...(query.correlationId ? { correlationId: query.correlationId } : {}),
                ...(query.missionId ? { missionId: query.missionId } : {}),
                ...(query.executionId ? { executionId: query.executionId } : {}),
            },
            orderBy: { timestamp: 'asc' },
            skip: query.offset ?? 0,
            take: query.limit,
        });
        return rows.map((row) => this.fromRow(row));
    }
    async count(query = {}) {
        return this.db.runtimeEventLog.count({
            where: {
                ...(query.tenantId ? { tenantId: query.tenantId } : {}),
                ...(query.type ? { type: query.type } : {}),
            },
        });
    }
    fromRow(row) {
        return {
            id: row.id,
            eventId: row.eventId,
            type: row.type,
            payload: row.payload,
            source: row.source,
            version: row.version,
            correlationId: row.correlationId ?? undefined,
            causationId: row.causationId ?? undefined,
            tenantId: row.tenantId ?? undefined,
            missionId: row.missionId ?? undefined,
            executionId: row.executionId ?? undefined,
            workflowId: row.workflowId ?? undefined,
            idempotencyKey: row.idempotencyKey ?? undefined,
            metadata: (row.metadata ?? {}),
            timestamp: new Date(row.timestamp).getTime(),
        };
    }
};
PrismaEventLog = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, Inject('PrismaService')),
    __metadata("design:paramtypes", [Function])
], PrismaEventLog);
export { PrismaEventLog };
