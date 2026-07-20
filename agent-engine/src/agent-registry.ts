import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { BaseAgent } from './base-agent.js';
import { AgentMetadata, AgentStatus } from '@oracle69/shared';

@Injectable()
export class AgentRegistry implements OnModuleDestroy {
  private readonly logger = new Logger(AgentRegistry.name);
  private agents: Map<string, BaseAgent> = new Map();

  async register(agent: BaseAgent) {
    await agent.onInitialize();
    await agent.onActivate();
    this.agents.set(agent.metadata.id, agent);
    this.logger.log(`Registered agent: ${agent.metadata.name} (${agent.metadata.role}) v${agent.metadata.version}`);
  }

  async deregister(id: string) {
    const agent = this.agents.get(id);
    if (agent) {
      await agent.onShutdown();
      this.agents.delete(id);
      this.logger.log(`Deregistered agent: ${agent.metadata.name}`);
    }
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  findAgentsByCapability(capability: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.metadata.capabilities.includes(capability)
    );
  }

  findAgentsByRole(role: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.metadata.role.toLowerCase() === role.toLowerCase()
    );
  }

  getAgentHealth(id: string): AgentStatus | undefined {
    return this.agents.get(id)?.metadata.healthStatus;
  }

  updateAgentStatus(id: string, status: AgentStatus) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.updateStatus(status);
      this.logger.log(`Agent ${id} status updated to ${status}`);
    }
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down all agents in registry...');
    for (const agent of this.agents.values()) {
      await agent.onShutdown();
    }
  }
}
