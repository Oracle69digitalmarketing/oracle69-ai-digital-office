import type { PrismaClient } from "@prisma/client";
import { EventLogSink } from "./event-bus.js";
import { RuntimeEvent } from "./runtime.events.js";
/** Nest DI token for the {@link EventLog} contract. */
export declare const EVENT_LOG = "EVENT_LOG";
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
export declare class InMemoryEventLog implements EventLog {
  private readonly records;
  private readonly byIdempotency;
  private toRecord;
  write(event: RuntimeEvent<unknown>): Promise<void>;
  findById(eventId: string): Promise<EventLogRecord | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<EventLogRecord | null>;
  findByTenant(tenantId: string, query?: EventLogQuery): Promise<EventLogRecord[]>;
  count(query?: EventLogQuery): Promise<number>;
  private query;
}
/**
 * Prisma-backed persistent event log.
 *
 * Persists every canonical event to the shared `RuntimeEventLog` table using
 * the globally provided `PrismaService`. Safe to register as an
 * {@link EventLogSink} on the canonical {@link EventBus}.
 */
export declare class PrismaEventLog implements EventLog {
  private readonly prisma?;
  constructor(prisma?: PrismaClient | undefined);
  private get db();
  write(event: RuntimeEvent<unknown>): Promise<void>;
  findById(eventId: string): Promise<EventLogRecord | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<EventLogRecord | null>;
  findByTenant(tenantId: string, query?: EventLogQuery): Promise<EventLogRecord[]>;
  count(query?: EventLogQuery): Promise<number>;
  private fromRow;
}
//# sourceMappingURL=event-log.d.ts.map
