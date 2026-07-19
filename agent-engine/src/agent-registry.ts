import { Injectable, Logger } from '@nestjs/common';
import { BaseAgent } from './base-agent';

@Injectable()
export class AgentRegistry {
  private readonly logger = new Logger(AgentRegistry.name);
  private agents: Map<string, BaseAgent> = new Map();

  register(agent: BaseAgent) {
    this.agents.set(agent.metadata.id, agent);
    this.logger.log(`Registered agent: ${agent.metadata.name} (${agent.metadata.role})`);
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
}
