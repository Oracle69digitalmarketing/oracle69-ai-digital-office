/**
 * Base class for all runtime-related errors.
 */
export class RuntimeError extends Error {
  constructor(
    message: string,
    public readonly metadata: Record<string, any> = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when runtime initialization fails.
 */
export class InitializationError extends RuntimeError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(`Initialization Failure: ${message}`, metadata);
  }
}

/**
 * Thrown when an agent fails validation during registration.
 */
export class RegistryValidationError extends RuntimeError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(`Registry Validation Failure: ${message}`, metadata);
  }
}

/**
 * Thrown when an agent ID conflict is detected.
 */
export class RegistryConflictError extends RuntimeError {
  constructor(agentId: string) {
    super(`Agent ID Conflict: Agent '${agentId}' is already registered.`, { agentId });
  }
}

/**
 * Thrown when a requested agent cannot be found in the registry.
 */
export class AgentNotFoundError extends RuntimeError {
  constructor(agentId: string) {
    super(`Agent Not Found: '${agentId}' could not be resolved.`, { agentId });
  }
}

/**
 * Thrown when a runtime context cannot be created.
 */
export class ContextCreationError extends RuntimeError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(`Context Creation Failure: ${message}`, metadata);
  }
}
