import { Injectable } from "@nestjs/common";
import { IContextManager } from "./memory.types.js";
import { RuntimeEventType } from "../events/runtime.events.js";
import { EventBus } from "../events/event-bus.js";

@Injectable()
export class ContextManager implements IContextManager {
  constructor(private readonly eventBus: EventBus) {}

  async hydrate(agentId: string, workflowId: string): Promise<Record<string, any>> {
    this.emit(RuntimeEventType.CONTEXT_LOADED, { agentId, workflowId });
    return { agentId, workflowId, data: {} };
  }

  compress(context: Record<string, any>): Record<string, any> {
    this.emit(RuntimeEventType.CONTEXT_COMPRESSED, {});
    return { ...context, compressed: true };
  }

  private emit(type: RuntimeEventType, payload: Record<string, unknown>): void {
    this.eventBus.publish(type, payload, { source: "ContextManager" });
  }
}
