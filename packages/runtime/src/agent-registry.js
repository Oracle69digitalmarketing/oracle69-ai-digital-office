var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentRegistry_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegistryValidationError, RegistryConflictError } from './errors/runtime.errors.js';
import { RuntimeEvent, RuntimeEventType } from './events/runtime.events.js';
let AgentRegistry = AgentRegistry_1 = class AgentRegistry {
    eventEmitter;
    logger = new Logger(AgentRegistry_1.name);
    agents = new Map();
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    register(metadata) {
        this.logger.debug(`Attempting to register agent: ${metadata.id}`);
        if (!this.validate(metadata)) {
            this.emit(RuntimeEventType.AGENT_VALIDATION_FAILED, { metadata });
            throw new RegistryValidationError('Agent metadata failed schema validation.', { metadata });
        }
        if (this.agents.has(metadata.id)) {
            throw new RegistryConflictError(metadata.id);
        }
        this.agents.set(metadata.id, metadata);
        this.logger.log(`Agent registered successfully: ${metadata.id} (${metadata.role})`);
        this.emit(RuntimeEventType.AGENT_REGISTERED, { agentId: metadata.id, role: metadata.role });
    }
    getAgent(id) {
        this.emit(RuntimeEventType.AGENT_LOOKUP, { agentId: id });
        const agent = this.agents.get(id) || null;
        if (agent) {
            this.emit(RuntimeEventType.AGENT_LOADED, { agentId: id });
        }
        return agent;
    }
    listAgentsByRole(role) {
        const agents = Array.from(this.agents.values());
        this.logger.debug(`Listing agents for role: ${role}. Total agents: ${agents.length}`);
        const filtered = agents.filter((agent) => agent.role === role);
        this.logger.debug(`Found ${filtered.length} agents for role: ${role}`);
        return filtered;
    }
    validate(metadata) {
        if (!metadata.id || typeof metadata.id !== 'string')
            return false;
        if (!metadata.name || typeof metadata.name !== 'string')
            return false;
        if (!metadata.role || typeof metadata.role !== 'string')
            return false;
        if (!metadata.version || typeof metadata.version !== 'string')
            return false;
        // Basic semver check (simplified)
        const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
        if (!semverRegex.test(metadata.version))
            return false;
        return true;
    }
    emit(type, payload) {
        if (this.eventEmitter) {
            this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
        }
    }
};
AgentRegistry = AgentRegistry_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], AgentRegistry);
export { AgentRegistry };
//# sourceMappingURL=agent-registry.js.map