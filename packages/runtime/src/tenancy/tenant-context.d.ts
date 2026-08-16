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
export declare class TenantContextError extends RuntimeError {
  constructor(message: string, metadata?: Record<string, any>);
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
export declare class TenantContextService {
  private readonly logger;
  private readonly storage;
  /**
   * Runs `fn` within the given tenant execution context. The context is
   * automatically inherited by any async work spawned by `fn`.
   */
  run<T>(context: TenantContext, fn: () => T): T;
  /**
   * Runs an async function within the given tenant execution context.
   */
  runAsync<T>(context: TenantContext, fn: () => Promise<T>): Promise<T>;
  /**
   * Returns the active tenant execution context, if any.
   */
  get(): TenantContext | undefined;
  /**
   * Returns the active tenant/organization identifier, if any.
   */
  getTenantId(): string | undefined;
  /**
   * Returns the active correlation identifier, if any.
   */
  getCorrelationId(): string | undefined;
  /**
   * Returns the active execution identifier, if any.
   */
  getExecutionId(): string | undefined;
  /**
   * Returns whether a tenant scope is currently active.
   */
  isTenantScopeActive(): boolean;
  /**
   * Resolves the effective tenant identifier from an explicit value, falling
   * back to the active tenant context. Throws {@link TenantContextError} when
   * no tenant scope can be resolved, enforcing tenant isolation.
   */
  resolveTenantId(explicit?: string): string;
}
//# sourceMappingURL=tenant-context.d.ts.map
