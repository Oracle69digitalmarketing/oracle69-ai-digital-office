import { IAgentRegistry, AgentMetadata } from "./runtime.types.js";
import { EventBus } from "./events/event-bus.js";
export declare class AgentRegistry implements IAgentRegistry {
  private readonly eventBus?;
  private readonly logger;
  private readonly agents;
  constructor(eventBus?: EventBus | undefined);
  register(metadata: AgentMetadata): void;
  getAgent(id: string): AgentMetadata | null;
  listAgentsByRole(role: string): AgentMetadata[];
  validate(metadata: AgentMetadata): boolean;
  private emit;
}
//# sourceMappingURL=agent-registry.d.ts.map
