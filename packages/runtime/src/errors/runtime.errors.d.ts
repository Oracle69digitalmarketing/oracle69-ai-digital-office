/**
 * Base class for all runtime-related errors.
 */
export declare class RuntimeError extends Error {
    readonly metadata: Record<string, any>;
    constructor(message: string, metadata?: Record<string, any>);
}
/**
 * Thrown when runtime initialization fails.
 */
export declare class InitializationError extends RuntimeError {
    constructor(message: string, metadata?: Record<string, any>);
}
/**
 * Thrown when an agent fails validation during registration.
 */
export declare class RegistryValidationError extends RuntimeError {
    constructor(message: string, metadata?: Record<string, any>);
}
/**
 * Thrown when an agent ID conflict is detected.
 */
export declare class RegistryConflictError extends RuntimeError {
    constructor(agentId: string);
}
/**
 * Thrown when a requested agent cannot be found in the registry.
 */
export declare class AgentNotFoundError extends RuntimeError {
    constructor(agentId: string);
}
/**
 * Thrown when a runtime context cannot be created.
 */
export declare class ContextCreationError extends RuntimeError {
    constructor(message: string, metadata?: Record<string, any>);
}
//# sourceMappingURL=runtime.errors.d.ts.map