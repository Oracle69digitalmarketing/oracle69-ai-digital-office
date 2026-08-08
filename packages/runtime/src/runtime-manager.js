var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RuntimeManager_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RuntimeState } from './runtime.types.js';
import { RuntimeContext } from './runtime-context.js';
import { AgentRegistry } from './agent-registry.js';
import { RuntimeEvent, RuntimeEventType } from './events/runtime.events.js';
import { InitializationError } from './errors/runtime.errors.js';
let RuntimeManager = RuntimeManager_1 = class RuntimeManager {
    eventEmitter;
    logger = new Logger(RuntimeManager_1.name);
    state = RuntimeState.UNINITIALIZED;
    registry;
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.registry = new AgentRegistry(this.eventEmitter);
    }
    /**
     * NestJS lifecycle hook for module initialization.
     */
    async onModuleInit() {
        await this.initialize();
    }
    /**
     * NestJS lifecycle hook for module destruction.
     */
    async onModuleDestroy() {
        await this.shutdown();
    }
    /**
     * Initializes the Enterprise Runtime Foundation and internal services.
     */
    async initialize() {
        if (this.state === RuntimeState.READY)
            return;
        this.logger.log('Initializing Enterprise Runtime Foundation...');
        this.state = RuntimeState.STARTING;
        this.emit(RuntimeEventType.RUNTIME_STARTED);
        try {
            // Future foundation initialization steps (e.g. loading core agents) would go here
            this.state = RuntimeState.READY;
            this.logger.log('Enterprise Runtime is READY.');
            this.emit(RuntimeEventType.RUNTIME_READY);
        }
        catch (error) {
            this.state = RuntimeState.UNINITIALIZED;
            const message = error instanceof Error ? error.message : String(error);
            this.emit(RuntimeEventType.RUNTIME_ERROR, { error: message });
            throw new InitializationError(message);
        }
    }
    /**
     * Gracefully shuts down the Enterprise Runtime.
     */
    async shutdown() {
        if (this.state === RuntimeState.STOPPED || this.state === RuntimeState.UNINITIALIZED)
            return;
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
    on(state, callback) {
        if (this.eventEmitter) {
            const eventType = this.mapStateToEvent(state);
            if (eventType) {
                this.eventEmitter.on(eventType, (event) => callback(event.payload));
            }
        }
    }
    /**
     * Creates a new execution context.
     */
    createContext(taskId, orgId) {
        if (this.state !== RuntimeState.READY) {
            this.logger.warn(`Context creation requested while runtime is in state: ${this.state}`);
        }
        return new RuntimeContext(taskId, orgId);
    }
    /**
     * Returns the agent registry.
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * Returns the current lifecycle state.
     */
    getState() {
        return this.state;
    }
    mapStateToEvent(state) {
        switch (state) {
            case RuntimeState.STARTING: return RuntimeEventType.RUNTIME_STARTED;
            case RuntimeState.READY: return RuntimeEventType.RUNTIME_READY;
            case RuntimeState.STOPPED: return RuntimeEventType.RUNTIME_SHUTDOWN;
            default: return null;
        }
    }
    emit(type, payload = {}) {
        if (this.eventEmitter) {
            this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
        }
    }
};
RuntimeManager = RuntimeManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], RuntimeManager);
export { RuntimeManager };
//# sourceMappingURL=runtime-manager.js.map