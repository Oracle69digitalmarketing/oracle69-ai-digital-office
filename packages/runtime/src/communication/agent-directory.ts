import { Injectable, Logger } from "@nestjs/common";
import { AgentMetadata } from "../runtime.types.js";

@Injectable()
export class AgentDirectory {
  private readonly logger = new Logger(AgentDirectory.name);
  private agents = new Map<string, AgentMetadata>();

  register(metadata: AgentMetadata): void {
    this.agents.set(metadata.id, metadata);
    this.logger.log(`Agent registered: ${metadata.id}`);
  }

  unregister(id: string): void {
    this.agents.delete(id);
    this.logger.log(`Agent unregistered: ${id}`);
  }

  lookup(id: string): AgentMetadata | undefined {
    return this.agents.get(id);
  }

  findByDepartment(deptId: string): AgentMetadata[] {
    return Array.from(this.agents.values()).filter((a) => a.metadata?.departmentId === deptId);
  }

  findByCapability(capability: string): AgentMetadata[] {
    return Array.from(this.agents.values()).filter((a) => a.capabilities?.includes(capability));
  }

  findAvailable(): AgentMetadata[] {
    return Array.from(this.agents.values()); // Simplified
  }

  heartbeat(id: string): void {
    this.logger.debug(`Heartbeat received from ${id}`);
  }
}
