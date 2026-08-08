/**
 * Represents the lifecycle state of the Enterprise Runtime.
 */
export declare enum RuntimeState {
    UNINITIALIZED = "uninitialized",
    STARTING = "starting",
    READY = "ready",
    STOPPING = "stopping",
    STOPPED = "stopped"
}
/**
 * Metadata defining an AI agent within the platform.
 */
export interface AgentMetadata {
    /** Unique identifier for the agent (e.g., 'receptionist-1') */
    id: string;
    /** Human-readable name (e.g., 'Alice') */
    name: string;
    /** Organizational role/department (e.g., 'receptionist', 'finance') */
    role: string;
    /** Semantic version of the agent definition */
    version: string;
    /** List of capabilities supported by the agent */
    capabilities?: string[];
    /** Additional agent-specific metadata */
    metadata?: Record<string, any>;
}
/**
 * Interface for the Runtime Context, which carries execution-specific state.
 */
export interface IRuntimeContext {
    /** Cross-system correlation ID for tracing */
    readonly traceId: string;
    /** Multi-tenant isolation ID */
    readonly orgId: string;
    /** ID of the task being executed */
    readonly taskId: string;
    /** ISO timestamp of when the context was created */
    readonly startTime: string;
    /**
     * Retrieves a value from the context metadata.
     * @param key The key to look up.
     */
    get(key: string): any;
    /**
     * Updates a value in the context metadata.
     * @param key The key to update.
     * @param value The new value.
     */
    set(key: string, value: any): void;
}
/**
 * Interface for the Agent Registry, the source of truth for digital employees.
 */
export interface IAgentRegistry {
    /**
     * Registers a new agent in the system.
     * @param metadata The metadata of the agent to register.
     */
    register(metadata: AgentMetadata): void;
    /**
     * Retrieves an agent by its unique ID.
     * @param id The agent ID.
     */
    getAgent(id: string): AgentMetadata | null;
    /**
     * Lists all agents registered with a specific role.
     * @param role The role to filter by.
     */
    listAgentsByRole(role: string): AgentMetadata[];
    /**
     * Validates if the given metadata conforms to the agent schema.
     * @param metadata The metadata to validate.
     */
    validate(metadata: AgentMetadata): boolean;
}
/**
 * Interface for runtime lifecycle monitoring.
 */
export interface IRuntimeLifecycle {
    /**
     * Returns the current lifecycle state.
     */
    getState(): RuntimeState;
    /**
     * Registers a callback for a specific lifecycle state transition.
     * @param state The state to listen for.
     * @param callback The function to execute.
     */
    on(state: RuntimeState, callback: (payload?: any) => void): void;
}
/**
 * Interface for the Runtime Manager, the supervisor of the runtime.
 */
export interface IRuntimeManager extends IRuntimeLifecycle {
    /**
     * Initializes the runtime and its internal services.
     */
    initialize(): Promise<void>;
    /**
     * Gracefully shuts down the runtime.
     */
    shutdown(): Promise<void>;
    /**
     * Creates a new execution context.
     * @param taskId The ID of the task.
     * @param orgId The organization ID.
     */
    createContext(taskId: string, orgId: string): IRuntimeContext;
    /**
     * Returns the agent registry.
     */
    getRegistry(): IAgentRegistry;
}
/**
 * Represents a runtime event.
 */
export interface IRuntimeEvent {
    /** Unique event identifier (e.g., 'runtime.ready') */
    readonly type: string;
    /** Data associated with the event */
    readonly payload: any;
    /** Unix timestamp of emission */
    readonly timestamp: number;
}
//# sourceMappingURL=runtime.types.d.ts.map