import { Injectable, Logger } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { RuntimeError } from "../errors/runtime.errors.js";

/**
 * Execution context propagated through asynchronous runtime boundaries.
 *
 * Carries the identifiers that make every runtime operation traceable to a
 * tenant (organization) and to the execution it belongs to. Values are
 * inherited by any async work spawned while the context is active.
 */
export interface TenantContext {
  /** Tenant/organization scope of the current execution. */
  tenantId?: string;
  /** Cross-system correlation identifier of the current execution. */
  correlationId?: string;
  /** Execution/task identifier of the current execution. */
  executionId?: string;
  /** Mission identifier when the current execution belongs to a mission. */
  missionId?: string;
  /** Workflow identifier when the current execution belongs to a workflow. */
  workflowId?: string;
}

/**
 * Thrown whenever a tenant-scoped operation is attempted without an active
 * tenant context.
 */
export class TenantContextError extends RuntimeError {
  constructor(message: string, metadata: Record<string, any> = {}) {
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
@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Runs `fn` within the given tenant execution context. The context is
   * automatically inherited by any async work spawned by `fn`.
   */
  run<T>(context: TenantContext, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  /**
   * Runs an async function within the given tenant execution context.
   */
  async runAsync<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(context, fn);
  }

  /**
   * Returns the active tenant execution context, if any.
   */
  get(): TenantContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Returns the active tenant/organization identifier, if any.
   */
  getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  /**
   * Returns the active correlation identifier, if any.
   */
  getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }

  /**
   * Returns the active execution identifier, if any.
   */
  getExecutionId(): string | undefined {
    return this.storage.getStore()?.executionId;
  }

  /**
   * Returns whether a tenant scope is currently active.
   */
  isTenantScopeActive(): boolean {
    return Boolean(this.storage.getStore()?.tenantId);
  }

  /**
   * Resolves the effective tenant identifier from an explicit value, falling
   * back to the active tenant context. Throws {@link TenantContextError} when
   * no tenant scope can be resolved, enforcing tenant isolation.
   */
  resolveTenantId(explicit?: string): string {
    const tenantId = explicit ?? this.getTenantId();
    if (!tenantId) {
      throw new TenantContextError("No active tenant context could be resolved.", {
        explicit: explicit ?? null,
      });
    }
    return tenantId;
  }
}
