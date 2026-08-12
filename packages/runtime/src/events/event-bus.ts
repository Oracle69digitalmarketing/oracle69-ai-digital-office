import { Injectable, Logger, Optional } from '@nestjs/common';
import { Subject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { RuntimeEvent, RuntimeEventOptions, RuntimeEventType } from './runtime.events.js';
import { EventCatalog, EventCatalogService } from './event-catalog.js';
import { TenantContextService } from '../tenancy/tenant-context.js';

/**
 * Persistent recorder integration point for the canonical event flow.
 *
 * A concrete `EventLog` implementation registers itself as a sink so every
 * published event can be recorded exactly once without introducing a second,
 * competing event pipeline.
 */
export interface EventLogSink {
  /** Persists a canonical runtime event. */
  write(event: RuntimeEvent<unknown>): void | Promise<void>;
}

/** Handler for subscriber/recorder failures surfaced by the canonical EventBus. */
export type EventErrorHandler = (error: Error, event?: RuntimeEvent<unknown>) => void;

/**
 * The canonical in-process event bus for the Enterprise Runtime.
 *
 * Every runtime service publishes and subscribes through this bus, which carries
 * the canonical `RuntimeEvent` envelope and the `RuntimeEventType` vocabulary.
 *
 * The bus additionally guarantees:
 * - **Idempotency**: re-publishing an event with the same `idempotencyKey`
 *   returns the originally published event and never re-dispatches it.
 * - **Causation propagation**: events published while handling another event
 *   are automatically causally linked (`causationId` = handled event id) and
 *   inherit its correlation, tenant, mission, execution and workflow
 *   identifiers unless explicitly overridden.
 * - **Tenant awareness**: events published without an explicit tenant inherit
 *   the active {@link TenantContextService} scope.
 *
 * All published events are additionally forwarded to registered
 * {@link EventLogSink} instances, providing a clean integration point for
 * persistent EventLog recording.
 */
@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly bus$ = new Subject<RuntimeEvent<unknown>>();
  private readonly sinks = new Set<EventLogSink>();
  private readonly errorHandlers = new Set<EventErrorHandler>();
  private readonly processedIdempotencyKeys = new Map<string, RuntimeEvent<unknown>>();
  private readonly activeEvents: RuntimeEvent<unknown>[] = [];

  constructor(
    @Optional() private readonly catalog?: EventCatalogService | EventCatalog,
    @Optional() private readonly tenantContext?: TenantContextService
  ) {}

  /**
   * Publishes a canonical runtime event. Supports both a fully-formed event and
   * the `(type, payload, options)` convenience form.
   */
  publish<T>(event: RuntimeEvent<T>): RuntimeEvent<T>;
  publish<T>(
    type: RuntimeEventType | string,
    payload: T,
    options?: RuntimeEventOptions
  ): RuntimeEvent<T>;
  publish<T>(
    eventOrType: RuntimeEvent<T> | (RuntimeEventType | string),
    payload?: T,
    options: RuntimeEventOptions = {}
  ): RuntimeEvent<T> {
    if (eventOrType instanceof RuntimeEvent) {
      return this.publishFormed(eventOrType);
    }

    const enriched = this.enrichOptions(options);
    const event = new RuntimeEvent(eventOrType as RuntimeEventType | string, payload as T, enriched);

    if (event.idempotencyKey) {
      const existing = this.processedIdempotencyKeys.get(event.idempotencyKey);
      if (existing) {
        this.logger.debug(`Idempotent publish suppressed for key ${event.idempotencyKey}.`);
        return existing as RuntimeEvent<T>;
      }
      this.processedIdempotencyKeys.set(event.idempotencyKey, event);
    }

    this.validateType(event.type);
    this.dispatch(event);
    return event;
  }

  /**
   * Subscribes to a single canonical event type. Async and sync handlers are
   * both supported; any thrown error or rejected promise is routed to the
   * registered error handlers instead of crashing the process.
   */
  subscribe<T = unknown>(
    type: RuntimeEventType | string,
    handler: (event: RuntimeEvent<T>) => void | Promise<void>
  ): Subscription {
    return this.bus$.asObservable().pipe(filter((event) => event.type === type)).subscribe((event) => {
      try {
        const result = handler(event as RuntimeEvent<T>);
        void Promise.resolve(result).catch((error: unknown) =>
          this.handleError(this.toError(error), event)
        );
      } catch (error) {
        this.handleError(this.toError(error), event);
      }
    });
  }

  /**
   * Returns a filtered observable of a single canonical event type.
   */
  ofType<T = unknown>(type: RuntimeEventType | string): Observable<RuntimeEvent<T>> {
    return this.bus$.asObservable().pipe(
      filter((event) => event.type === type),
      map((event) => event as RuntimeEvent<T>)
    );
  }

  /**
   * Returns an observable of every canonical event published on the bus.
   * This is the streaming integration point for observability and auditing.
   */
  allEvents(): Observable<RuntimeEvent<unknown>> {
    return this.bus$.asObservable();
  }

  /**
   * Registers a handler invoked whenever a subscriber or recorder fails.
   */
  onError(handler: EventErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  /**
   * Registers a persistent EventLog recorder that receives every published event.
   */
  registerLogSink(sink: EventLogSink): void {
    this.sinks.add(sink);
  }

  /**
   * Removes a previously registered EventLog recorder.
   */
  unregisterLogSink(sink: EventLogSink): void {
    this.sinks.delete(sink);
  }

  /**
   * Returns the event originally published for an idempotency key, if any.
   */
  getByIdempotencyKey(idempotencyKey: string): RuntimeEvent<unknown> | undefined {
    return this.processedIdempotencyKeys.get(idempotencyKey);
  }

  /**
   * Completes the bus, signalling to all subscribers that no further events
   * will be published.
   */
  complete(): void {
    this.bus$.complete();
  }

  private publishFormed<T>(event: RuntimeEvent<T>): RuntimeEvent<T> {
    if (event.idempotencyKey) {
      const existing = this.processedIdempotencyKeys.get(event.idempotencyKey);
      if (existing) {
        this.logger.debug(`Idempotent publish suppressed for key ${event.idempotencyKey}.`);
        return existing as RuntimeEvent<T>;
      }
      this.processedIdempotencyKeys.set(event.idempotencyKey, event);
    }
    this.validateType(event.type);
    this.dispatch(event);
    return event;
  }

  /**
   * Merges explicit event options with the active causation/tenant context so
   * identifiers propagate through the event pipeline.
   */
  private enrichOptions(options: RuntimeEventOptions): RuntimeEventOptions {
    const active = this.activeEvents[this.activeEvents.length - 1];
    const tenantScope = active
      ? {
          correlationId: active.correlationId,
          tenantId: active.tenantId,
          executionId: active.executionId,
          missionId: active.missionId,
          workflowId: active.workflowId,
        }
      : this.tenantContext
        ? {
            correlationId: this.tenantContext.getCorrelationId(),
            tenantId: this.tenantContext.getTenantId(),
            executionId: this.tenantContext.getExecutionId(),
            missionId: undefined,
            workflowId: undefined,
          }
        : {
            correlationId: undefined,
            tenantId: undefined,
            executionId: undefined,
            missionId: undefined,
            workflowId: undefined,
          };

    const context = options.context
      ? {
          correlationId: options.context.traceId,
          tenantId: options.context.orgId,
          executionId: options.context.taskId,
          missionId: undefined,
          workflowId: undefined,
        }
      : tenantScope;

    return {
      ...options,
      causationId: options.causationId ?? (active ? active.eventId : undefined),
      correlationId: options.correlationId ?? context.correlationId,
      tenantId: options.tenantId ?? context.tenantId,
      executionId: options.executionId ?? context.executionId,
      missionId: options.missionId ?? context.missionId,
      workflowId: options.workflowId ?? context.workflowId,
    };
  }

  private validateType(type: string): void {
    if (this.catalog && !this.catalog.isCanonical(type)) {
      this.logger.debug(`Publishing non-canonical domain event type '${type}'.`);
    }
  }

  private dispatch(event: RuntimeEvent<unknown>): void {
    this.logger.debug(`Event published: ${event.type} [${event.eventId}]`);
    this.activeEvents.push(event);
    try {
      this.bus$.next(event);
    } finally {
      this.activeEvents.pop();
    }
    void this.notifySinks(event);
  }

  private async notifySinks(event: RuntimeEvent<unknown>): Promise<void> {
    for (const sink of this.sinks) {
      try {
        await sink.write(event);
      } catch (error) {
        this.handleError(this.toError(error), event);
      }
    }
  }

  private handleError(error: Error, event?: RuntimeEvent<unknown>): void {
    this.logger.error(`Event handler error${event ? ` for ${event.type}` : ''}: ${error.message}`);
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error, event);
      } catch (handlerError) {
        this.logger.error('Event error handler failed', handlerError);
      }
    });
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }
}
