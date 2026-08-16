import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { EventLogSink } from "./event-bus.js";
import { RuntimeEvent } from "./runtime.events.js";

/** Nest DI token for the {@link EventLog} contract. */
export const EVENT_LOG = "EVENT_LOG";

/**
 * Query options used to page through the persistent event log.
 */
export interface EventLogQuery {
  readonly tenantId?: string;
  readonly type?: string;
  readonly correlationId?: string;
  readonly missionId?: string;
  readonly executionId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Persistent representation of a canonical runtime event.
 */
export interface EventLogRecord {
  readonly id: string;
  readonly eventId: string;
  readonly type: string;
  readonly payload: unknown;
  readonly source: string;
  readonly version: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly missionId?: string;
  readonly executionId?: string;
  readonly workflowId?: string;
  readonly idempotencyKey?: string;
  readonly metadata: Record<string, unknown>;
  readonly timestamp: number;
}

/**
 * Persistent event log contract.
 *
 * Implementations receive every canonical event published on the
 * {@link EventBus} (through the {@link EventLogSink} contract) and expose
 * tenant-scoped, idempotency-aware read operations for auditing, replay and
 * trace reconstruction.
 */
export interface EventLog extends EventLogSink {
  /** Persists a canonical runtime event exactly once. */
  write(event: RuntimeEvent<unknown>): Promise<void> | void;
  /** Returns a single event log record by its unique event id. */
  findById(eventId: string): Promise<EventLogRecord | null>;
  /** Returns the recorded event for an idempotency key, if one exists. */
  findByIdempotencyKey(idempotencyKey: string): Promise<EventLogRecord | null>;
  /** Lists event log records, optionally scoped to a tenant and filters. */
  findByTenant(tenantId: string, query?: EventLogQuery): Promise<EventLogRecord[]>;
  /** Returns the number of recorded events matching the query. */
  count(query?: EventLogQuery): Promise<number>;
}

/**
 * In-memory event log used for tests and for standalone runtimes without a
 * database connection. Records are deduplicated by idempotency key.
 */
@Injectable()
export class InMemoryEventLog implements EventLog {
  private readonly records: EventLogRecord[] = [];
  private readonly byIdempotency = new Map<string, string>();

  private toRecord(event: RuntimeEvent<unknown>): EventLogRecord {
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

  async write(event: RuntimeEvent<unknown>): Promise<void> {
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

  async findById(eventId: string): Promise<EventLogRecord | null> {
    return this.records.find((r) => r.eventId === eventId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<EventLogRecord | null> {
    const eventId = this.byIdempotency.get(idempotencyKey);
    if (!eventId) return null;
    return this.records.find((r) => r.eventId === eventId) ?? null;
  }

  async findByTenant(tenantId: string, query: EventLogQuery = {}): Promise<EventLogRecord[]> {
    return this.query(tenantId, query);
  }

  async count(query: EventLogQuery = {}): Promise<number> {
    return this.query(query.tenantId, query).length;
  }

  private query(tenantId: string | undefined, query: EventLogQuery): EventLogRecord[] {
    let records = this.records;
    if (tenantId) {
      records = records.filter((r) => r.tenantId === tenantId);
    }
    if (query.type) records = records.filter((r) => r.type === query.type);
    if (query.correlationId)
      records = records.filter((r) => r.correlationId === query.correlationId);
    if (query.missionId) records = records.filter((r) => r.missionId === query.missionId);
    if (query.executionId) records = records.filter((r) => r.executionId === query.executionId);

    const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? sorted.length;
    return sorted.slice(offset, offset + limit);
  }
}

/**
 * Prisma-backed persistent event log.
 *
 * Persists every canonical event to the shared `RuntimeEventLog` table using
 * the globally provided `PrismaService`. Safe to register as an
 * {@link EventLogSink} on the canonical {@link EventBus}.
 */
@Injectable()
export class PrismaEventLog implements EventLog {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available for the persistent EventLog.");
    }
    return this.prisma;
  }

  async write(event: RuntimeEvent<unknown>): Promise<void> {
    await this.db.runtimeEventLog.upsert({
      where: { eventId: event.eventId },
      create: {
        eventId: event.eventId,
        type: event.type,
        payload: event.payload as object,
        source: event.source,
        version: event.version,
        correlationId: event.correlationId ?? null,
        causationId: event.causationId ?? null,
        tenantId: event.tenantId ?? null,
        missionId: event.missionId ?? null,
        executionId: event.executionId ?? null,
        workflowId: event.workflowId ?? null,
        idempotencyKey: event.idempotencyKey ?? null,
        metadata: (event.metadata ?? {}) as object,
        timestamp: new Date(event.timestamp),
      },
      update: {},
    });
  }

  async findById(eventId: string): Promise<EventLogRecord | null> {
    const row = await this.db.runtimeEventLog.findUnique({ where: { eventId } });
    return row ? this.fromRow(row) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<EventLogRecord | null> {
    const row = await this.db.runtimeEventLog.findUnique({ where: { idempotencyKey } });
    return row ? this.fromRow(row) : null;
  }

  async findByTenant(tenantId: string, query: EventLogQuery = {}): Promise<EventLogRecord[]> {
    const rows = await this.db.runtimeEventLog.findMany({
      where: {
        tenantId,
        ...(query.type ? { type: query.type } : {}),
        ...(query.correlationId ? { correlationId: query.correlationId } : {}),
        ...(query.missionId ? { missionId: query.missionId } : {}),
        ...(query.executionId ? { executionId: query.executionId } : {}),
      },
      orderBy: { timestamp: "asc" },
      skip: query.offset ?? 0,
      take: query.limit,
    });
    return rows.map((row: unknown) => this.fromRow(row as any));
  }

  async count(query: EventLogQuery = {}): Promise<number> {
    return this.db.runtimeEventLog.count({
      where: {
        ...(query.tenantId ? { tenantId: query.tenantId } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
    });
  }

  private fromRow(row: any): EventLogRecord {
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
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      timestamp: new Date(row.timestamp).getTime(),
    };
  }
}
