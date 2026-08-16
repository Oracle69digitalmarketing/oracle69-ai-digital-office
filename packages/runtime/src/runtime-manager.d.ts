import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { IRuntimeManager, IAgentRegistry, IRuntimeContext, RuntimeState } from "./runtime.types.js";
import { EventBus } from "./events/event-bus.js";
export declare class RuntimeManager implements IRuntimeManager, OnModuleInit, OnModuleDestroy {
  private readonly eventBus?;
  private readonly logger;
  private state;
  private readonly registry;
  constructor(eventBus?: EventBus | undefined);
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
  on(state: RuntimeState, callback: (payload?: unknown) => void): void;
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
