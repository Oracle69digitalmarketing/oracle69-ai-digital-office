import { Injectable, Logger, OnModuleDestroy, Optional } from "@nestjs/common";
import { BaseAgent } from "./base-agent.js";
import { AgentMetadata, AgentStatus } from "@oracle69/shared";

export interface AgentRegistryStore {
  register(
    agentId: string,
    role: string,
    healthStatus: AgentStatus,
    organizationId?: string,
  ): Promise<void>;
  updateStatus(agentId: string, healthStatus: AgentStatus): Promise<void>;
}

@Injectable()
export class AgentRegistry implements OnModuleDestroy {
  private readonly logger = new Logger(AgentRegistry.name);
  private agents: Map<string, BaseAgent> = new Map();

  constructor(@Optional() private readonly store?: AgentRegistryStore) {}

  async register(agent: BaseAgent, organizationId?: string) {
    await agent.onInitialize();
    await agent.onActivate();
    this.agents.set(agent.metadata.id, agent);

    if (this.store) {
      try {
        await this.store.register(
          agent.metadata.id,
          agent.metadata.role,
          agent.metadata.healthStatus,
          organizationId,
        );
      } catch (error) {
        this.logger.error(`Failed to persist agent ${agent.metadata.id} to registry store`, error);
      }
    }

    this.logger.log(
      `Registered agent: ${agent.metadata.name} (${agent.metadata.role}) v${agent.metadata.version}`,
    );
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
    return Array.from(this.agents.values()).filter((agent) =>
      agent.metadata.capabilities.includes(capability),
    );
  }

  findAgentsByRole(role: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.metadata.role.toLowerCase() === role.toLowerCase(),
    );
  }

  getAgentHealth(id: string): AgentStatus | undefined {
    return this.agents.get(id)?.metadata.healthStatus;
  }

  async updateAgentStatus(id: string, status: AgentStatus) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.updateStatus(status);

      if (this.store) {
        try {
          await this.store.updateStatus(id, status);
        } catch (error) {
          this.logger.error(`Failed to update agent ${id} status in registry store`, error);
        }
      }

      this.logger.log(`Agent ${id} status updated to ${status}`);
    }
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async onModuleDestroy() {
    this.logger.log("Shutting down all agents in registry...");
    for (const agent of this.agents.values()) {
      await agent.onShutdown();
    }
  }
}
