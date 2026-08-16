import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventBus } from "./event-bus.js";
import type { EventLog } from "./event-log.js";
/**
 * Wires a persistent {@link EventLog} into the canonical {@link EventBus} as
 * an {@link EventLogSink} so every published event is recorded exactly once.
 *
 * Registered on module init and removed on module destroy so the recorder does
 * not outlive the application.
 */
export declare class EventLogWriter implements OnModuleInit, OnModuleDestroy {
  private readonly eventBus;
  private readonly eventLog;
  private readonly logger;
  constructor(eventBus: EventBus, eventLog: EventLog);
  onModuleInit(): void;
  onModuleDestroy(): void;
}
//# sourceMappingURL=event-log-writer.d.ts.map
