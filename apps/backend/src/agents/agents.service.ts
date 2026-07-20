import { Injectable } from "@nestjs/common";
import { AgentRegistry } from "@oracle69/agent-engine";

@Injectable()
export class AgentsService {
  constructor(private registry: AgentRegistry) {}

  async findAll() {
    return this.registry.getAllAgents().map((agent) => ({
      ...agent.metadata,
      // Hide sensitive info if any
    }));
  }

  async findOne(id: string) {
    return this.registry.getAgent(id)?.metadata;
  }
}
