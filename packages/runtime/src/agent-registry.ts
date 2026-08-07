import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAgentRegistry, AgentMetadata } from './runtime.types.js';
import { RegistryValidationError, RegistryConflictError } from './errors/runtime.errors.js';
import { RuntimeEvent, RuntimeEventType } from './events/runtime.events.js';

@Injectable()
export class AgentRegistry implements IAgentRegistry {
  private readonly logger = new Logger(AgentRegistry.name);
  private readonly agents = new Map<string, AgentMetadata>();

  constructor(private readonly eventEmitter?: EventEmitter2) {}

  public register(metadata: AgentMetadata): void {
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

  public getAgent(id: string): AgentMetadata | null {
    this.emit(RuntimeEventType.AGENT_LOOKUP, { agentId: id });
    const agent = this.agents.get(id) || null;
    
    if (agent) {
      this.emit(RuntimeEventType.AGENT_LOADED, { agentId: id });
    }
    
    return agent;
  }

  public listAgentsByRole(role: string): AgentMetadata[] {
    const agents = Array.from(this.agents.values());
    this.logger.debug(`Listing agents for role: ${role}. Total agents: ${agents.length}`);
    const filtered = agents.filter((agent) => agent.role === role);
    this.logger.debug(`Found ${filtered.length} agents for role: ${role}`);
    return filtered;
  }

  public validate(metadata: AgentMetadata): boolean {
    if (!metadata.id || typeof metadata.id !== 'string') return false;
    if (!metadata.name || typeof metadata.name !== 'string') return false;
    if (!metadata.role || typeof metadata.role !== 'string') return false;
    if (!metadata.version || typeof metadata.version !== 'string') return false;
    
    // Basic semver check (simplified)
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
    if (!semverRegex.test(metadata.version)) return false;

    return true;
  }

  private emit(type: RuntimeEventType, payload: any): void {
    if (this.eventEmitter) {
      this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
    }
  }
}
