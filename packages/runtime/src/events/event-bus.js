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
var EventBus_1;
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { RuntimeEvent } from './runtime.events.js';
import { TenantContextService } from '../tenancy/tenant-context.js';
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
let EventBus = EventBus_1 = class EventBus {
    catalog;
    tenantContext;
    logger = new Logger(EventBus_1.name);
    bus$ = new Subject();
    sinks = new Set();
    errorHandlers = new Set();
    processedIdempotencyKeys = new Map();
    activeEvents = [];
    constructor(catalog, tenantContext) {
        this.catalog = catalog;
        this.tenantContext = tenantContext;
    }
    publish(eventOrType, payload, options = {}) {
        if (eventOrType instanceof RuntimeEvent) {
            return this.publishFormed(eventOrType);
        }
        const enriched = this.enrichOptions(options);
        const event = new RuntimeEvent(eventOrType, payload, enriched);
        if (event.idempotencyKey) {
            const existing = this.processedIdempotencyKeys.get(event.idempotencyKey);
            if (existing) {
                this.logger.debug(`Idempotent publish suppressed for key ${event.idempotencyKey}.`);
                return existing;
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
    subscribe(type, handler) {
        return this.bus$.asObservable().pipe(filter((event) => event.type === type)).subscribe((event) => {
            try {
                const result = handler(event);
                void Promise.resolve(result).catch((error) => this.handleError(this.toError(error), event));
            }
            catch (error) {
                this.handleError(this.toError(error), event);
            }
        });
    }
    /**
     * Returns a filtered observable of a single canonical event type.
     */
    ofType(type) {
        return this.bus$.asObservable().pipe(filter((event) => event.type === type), map((event) => event));
    }
    /**
     * Returns an observable of every canonical event published on the bus.
     * This is the streaming integration point for observability and auditing.
     */
    allEvents() {
        return this.bus$.asObservable();
    }
    /**
     * Registers a handler invoked whenever a subscriber or recorder fails.
     */
    onError(handler) {
        this.errorHandlers.add(handler);
    }
    /**
     * Registers a persistent EventLog recorder that receives every published event.
     */
    registerLogSink(sink) {
        this.sinks.add(sink);
    }
    /**
     * Removes a previously registered EventLog recorder.
     */
    unregisterLogSink(sink) {
        this.sinks.delete(sink);
    }
    /**
     * Returns the event originally published for an idempotency key, if any.
     */
    getByIdempotencyKey(idempotencyKey) {
        return this.processedIdempotencyKeys.get(idempotencyKey);
    }
    /**
     * Completes the bus, signalling to all subscribers that no further events
     * will be published.
     */
    complete() {
        this.bus$.complete();
    }
    publishFormed(event) {
        if (event.idempotencyKey) {
            const existing = this.processedIdempotencyKeys.get(event.idempotencyKey);
            if (existing) {
                this.logger.debug(`Idempotent publish suppressed for key ${event.idempotencyKey}.`);
                return existing;
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
    enrichOptions(options) {
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
    validateType(type) {
        if (this.catalog && !this.catalog.isCanonical(type)) {
            this.logger.debug(`Publishing non-canonical domain event type '${type}'.`);
        }
    }
    dispatch(event) {
        this.logger.debug(`Event published: ${event.type} [${event.eventId}]`);
        this.activeEvents.push(event);
        try {
            this.bus$.next(event);
        }
        finally {
            this.activeEvents.pop();
        }
        void this.notifySinks(event);
    }
    async notifySinks(event) {
        for (const sink of this.sinks) {
            try {
                await sink.write(event);
            }
            catch (error) {
                this.handleError(this.toError(error), event);
            }
        }
    }
    handleError(error, event) {
        this.logger.error(`Event handler error${event ? ` for ${event.type}` : ''}: ${error.message}`);
        this.errorHandlers.forEach((handler) => {
            try {
                handler(error, event);
            }
            catch (handlerError) {
                this.logger.error('Event error handler failed', handlerError);
            }
        });
    }
    toError(error) {
        return error instanceof Error ? error : new Error(String(error));
    }
};
EventBus = EventBus_1 = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(1, Optional()),
    __metadata("design:paramtypes", [Object, TenantContextService])
], EventBus);
export { EventBus };
