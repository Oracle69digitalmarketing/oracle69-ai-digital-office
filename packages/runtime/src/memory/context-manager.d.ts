import { IContextManager } from "./memory.types.js";
import { EventBus } from "../events/event-bus.js";
export declare class ContextManager implements IContextManager {
  private readonly eventBus;
  constructor(eventBus: EventBus);
  hydrate(agentId: string, workflowId: string): Promise<Record<string, any>>;
  compress(context: Record<string, any>): Record<string, any>;
  private emit;
}
//# sourceMappingURL=context-manager.d.ts.map
