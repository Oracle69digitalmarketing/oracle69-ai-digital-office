import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IRuntimeManager, IAgentRegistry, IRuntimeContext, RuntimeState } from './runtime.types.js';
import { RuntimeContext } from './runtime-context.js';
import { AgentRegistry } from './agent-registry.js';
import { RuntimeEvent, RuntimeEventType } from './events/runtime.events.js';
import { InitializationError } from './errors/runtime.errors.js';

@Injectable()
export class RuntimeManager implements IRuntimeManager, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RuntimeManager.name);
  private state: RuntimeState = RuntimeState.UNINITIALIZED;
  private readonly registry: AgentRegistry;

  constructor(private readonly eventEmitter?: EventEmitter2) {
    this.registry = new AgentRegistry(this.eventEmitter);
  }

  /**
   * NestJS lifecycle hook for module initialization.
   */
  public async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  /**
   * NestJS lifecycle hook for module destruction.
   */
  public async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Initializes the Enterprise Runtime Foundation and internal services.
   */
  public async initialize(): Promise<void> {
    if (this.state === RuntimeState.READY) return;

    this.logger.log('Initializing Enterprise Runtime Foundation...');
    this.state = RuntimeState.STARTING;
    this.emit(RuntimeEventType.RUNTIME_STARTED);

    try {
      // Future foundation initialization steps (e.g. loading core agents) would go here
      
      this.state = RuntimeState.READY;
      this.logger.log('Enterprise Runtime is READY.');
      this.emit(RuntimeEventType.RUNTIME_READY);
    } catch (error) {
      this.state = RuntimeState.UNINITIALIZED;
      const message = error instanceof Error ? error.message : String(error);
      this.emit(RuntimeEventType.RUNTIME_ERROR, { error: message });
      throw new InitializationError(message);
    }
  }

  /**
   * Gracefully shuts down the Enterprise Runtime.
   */
  public async shutdown(): Promise<void> {
    if (this.state === RuntimeState.STOPPED || this.state === RuntimeState.UNINITIALIZED) return;

    this.logger.log('Shutting down Enterprise Runtime...');
    this.state = RuntimeState.STOPPING;

    // Graceful cleanup logic would go here
    
    this.state = RuntimeState.STOPPED;
    this.logger.log('Enterprise Runtime has STOPPED.');
    this.emit(RuntimeEventType.RUNTIME_SHUTDOWN);
  }

  /**
   * Registers a callback for a specific lifecycle state transition.
   */
  public on(state: RuntimeState, callback: (payload?: any) => void): void {
    if (this.eventEmitter) {
      const eventType = this.mapStateToEvent(state);
      if (eventType) {
        this.eventEmitter.on(eventType, (event: RuntimeEvent) => callback(event.payload));
      }
    }
  }

  /**
   * Creates a new execution context.
   */
  public createContext(taskId: string, orgId: string): IRuntimeContext {
    if (this.state !== RuntimeState.READY) {
      this.logger.warn(`Context creation requested while runtime is in state: ${this.state}`);
    }
    return new RuntimeContext(taskId, orgId);
  }

  /**
   * Returns the agent registry.
   */
  public getRegistry(): IAgentRegistry {
    return this.registry;
  }

  /**
   * Returns the current lifecycle state.
   */
  public getState(): RuntimeState {
    return this.state;
  }

  private mapStateToEvent(state: RuntimeState): RuntimeEventType | null {
    switch (state) {
      case RuntimeState.STARTING: return RuntimeEventType.RUNTIME_STARTED;
      case RuntimeState.READY: return RuntimeEventType.RUNTIME_READY;
      case RuntimeState.STOPPED: return RuntimeEventType.RUNTIME_SHUTDOWN;
      default: return null;
    }
  }

  private emit(type: RuntimeEventType, payload: any = {}): void {
    if (this.eventEmitter) {
      this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
    }
  }
}
