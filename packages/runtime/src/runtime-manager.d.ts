import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IRuntimeManager, IAgentRegistry, IRuntimeContext, RuntimeState } from './runtime.types.js';
export declare class RuntimeManager implements IRuntimeManager, OnModuleInit, OnModuleDestroy {
    private readonly eventEmitter?;
    private readonly logger;
    private state;
    private readonly registry;
    constructor(eventEmitter?: EventEmitter2 | undefined);
    /**
     * NestJS lifecycle hook for module initialization.
     */
    onModuleInit(): Promise<void>;
    /**
     * NestJS lifecycle hook for module destruction.
     */
    onModuleDestroy(): Promise<void>;
    /**
     * Initializes the Enterprise Runtime Foundation and internal services.
     */
    initialize(): Promise<void>;
    /**
     * Gracefully shuts down the Enterprise Runtime.
     */
    shutdown(): Promise<void>;
    /**
     * Registers a callback for a specific lifecycle state transition.
     */
    on(state: RuntimeState, callback: (payload?: any) => void): void;
    /**
     * Creates a new execution context.
     */
    createContext(taskId: string, orgId: string): IRuntimeContext;
    /**
     * Returns the agent registry.
     */
    getRegistry(): IAgentRegistry;
    /**
     * Returns the current lifecycle state.
     */
    getState(): RuntimeState;
    private mapStateToEvent;
    private emit;
}
//# sourceMappingURL=runtime-manager.d.ts.map