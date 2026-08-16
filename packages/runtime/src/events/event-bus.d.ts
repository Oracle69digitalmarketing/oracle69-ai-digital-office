import { Observable, Subscription } from "rxjs";
import { RuntimeEvent, RuntimeEventOptions, RuntimeEventType } from "./runtime.events.js";
import { EventCatalog, EventCatalogService } from "./event-catalog.js";
import { TenantContextService } from "../tenancy/tenant-context.js";
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
export declare class EventBus {
  private readonly catalog?;
  private readonly tenantContext?;
  private readonly logger;
  private readonly bus$;
  private readonly sinks;
  private readonly errorHandlers;
  private readonly processedIdempotencyKeys;
  private readonly activeEvents;
  constructor(
    catalog?: (EventCatalogService | EventCatalog) | undefined,
    tenantContext?: TenantContextService | undefined,
  );
  /**
   * Publishes a canonical runtime event. Supports both a fully-formed event and
   * the `(type, payload, options)` convenience form.
   */
  publish<T>(event: RuntimeEvent<T>): RuntimeEvent<T>;
  publish<T>(
    type: RuntimeEventType | string,
    payload: T,
    options?: RuntimeEventOptions,
  ): RuntimeEvent<T>;
  /**
   * Subscribes to a single canonical event type. Async and sync handlers are
   * both supported; any thrown error or rejected promise is routed to the
   * registered error handlers instead of crashing the process.
   */
  subscribe<T = unknown>(
    type: RuntimeEventType | string,
    handler: (event: RuntimeEvent<T>) => void | Promise<void>,
  ): Subscription;
  /**
   * Returns a filtered observable of a single canonical event type.
   */
  ofType<T = unknown>(type: RuntimeEventType | string): Observable<RuntimeEvent<T>>;
  /**
   * Returns an observable of every canonical event published on the bus.
   * This is the streaming integration point for observability and auditing.
   */
  allEvents(): Observable<RuntimeEvent<unknown>>;
  /**
   * Registers a handler invoked whenever a subscriber or recorder fails.
   */
  onError(handler: EventErrorHandler): void;
  /**
   * Registers a persistent EventLog recorder that receives every published event.
   */
  registerLogSink(sink: EventLogSink): void;
  /**
   * Removes a previously registered EventLog recorder.
   */
  unregisterLogSink(sink: EventLogSink): void;
  /**
   * Returns the event originally published for an idempotency key, if any.
   */
  getByIdempotencyKey(idempotencyKey: string): RuntimeEvent<unknown> | undefined;
  /**
   * Completes the bus, signalling to all subscribers that no further events
   * will be published.
   */
  complete(): void;
  private publishFormed;
  /**
   * Merges explicit event options with the active causation/tenant context so
   * identifiers propagate through the event pipeline.
   */
  private enrichOptions;
  private validateType;
  private dispatch;
  private notifySinks;
  private handleError;
  private toError;
}
//# sourceMappingURL=event-bus.d.ts.map
