import { Injectable } from "@nestjs/common";
import { RuntimeEvent } from "../events/runtime.events.js";
import { EventBus } from "../events/event-bus.js";

/**
 * Compatibility facade over the canonical {@link EventBus}.
 *
 * Retained so existing consumers (enterprise intelligence packages) can keep
 * publishing through the `MessageBus.publish(type, payload)` contract while all
 * events are routed through the single canonical runtime event pipeline.
 */
@Injectable()
export class MessageBus {
  constructor(private readonly eventBus: EventBus) {}

  publish(event: string, payload: any = {}, metadata: any = {}): void {
    if (payload instanceof RuntimeEvent) {
      this.eventBus.publish(payload);
    } else {
      this.eventBus.publish(event, payload, metadata);
    }
  }
}
