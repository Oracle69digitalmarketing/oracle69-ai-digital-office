var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TenantContextService_1;
import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RuntimeError } from '../errors/runtime.errors.js';
/**
 * Thrown whenever a tenant-scoped operation is attempted without an active
 * tenant context.
 */
export class TenantContextError extends RuntimeError {
    constructor(message, metadata = {}) {
        super(`Tenant Context Failure: ${message}`, metadata);
    }
}
/**
 * Propagates and enforces the tenant (organization) scope of every runtime
 * operation.
 *
 * Uses `AsyncLocalStorage` so the tenant context flows naturally through
 * promises and async handlers. The canonical {@link EventBus} reads the active
 * context to enrich events with tenant-aware metadata, and mission operations
 * enforce a tenant scope before any persistence or execution occurs.
 */
let TenantContextService = TenantContextService_1 = class TenantContextService {
    logger = new Logger(TenantContextService_1.name);
    storage = new AsyncLocalStorage();
    /**
     * Runs `fn` within the given tenant execution context. The context is
     * automatically inherited by any async work spawned by `fn`.
     */
    run(context, fn) {
        return this.storage.run(context, fn);
    }
    /**
     * Runs an async function within the given tenant execution context.
     */
    async runAsync(context, fn) {
        return this.storage.run(context, fn);
    }
    /**
     * Returns the active tenant execution context, if any.
     */
    get() {
        return this.storage.getStore();
    }
    /**
     * Returns the active tenant/organization identifier, if any.
     */
    getTenantId() {
        return this.storage.getStore()?.tenantId;
    }
    /**
     * Returns the active correlation identifier, if any.
     */
    getCorrelationId() {
        return this.storage.getStore()?.correlationId;
    }
    /**
     * Returns the active execution identifier, if any.
     */
    getExecutionId() {
        return this.storage.getStore()?.executionId;
    }
    /**
     * Returns whether a tenant scope is currently active.
     */
    isTenantScopeActive() {
        return Boolean(this.storage.getStore()?.tenantId);
    }
    /**
     * Resolves the effective tenant identifier from an explicit value, falling
     * back to the active tenant context. Throws {@link TenantContextError} when
     * no tenant scope can be resolved, enforcing tenant isolation.
     */
    resolveTenantId(explicit) {
        const tenantId = explicit ?? this.getTenantId();
        if (!tenantId) {
            throw new TenantContextError('No active tenant context could be resolved.', {
                explicit: explicit ?? null,
            });
        }
        return tenantId;
    }
};
TenantContextService = TenantContextService_1 = __decorate([
    Injectable()
], TenantContextService);
export { TenantContextService };
