import { EventBus } from "../events/event-bus.js";
/**
 * Compatibility facade over the canonical {@link EventBus}.
 *
 * Retained so existing consumers (enterprise intelligence packages) can keep
 * publishing through the `MessageBus.publish(type, payload)` contract while all
 * events are routed through the single canonical runtime event pipeline.
 */
export declare class MessageBus {
  private readonly eventBus;
  constructor(eventBus: EventBus);
  publish(event: string, payload?: any, metadata?: any): void;
}
//# sourceMappingURL=message-bus.d.ts.map
