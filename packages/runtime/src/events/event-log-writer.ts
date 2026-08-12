import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventBus } from './event-bus.js';
import type { EventLog } from './event-log.js';
import { EVENT_LOG } from './event-log.js';

/**
 * Wires a persistent {@link EventLog} into the canonical {@link EventBus} as
 * an {@link EventLogSink} so every published event is recorded exactly once.
 *
 * Registered on module init and removed on module destroy so the recorder does
 * not outlive the application.
 */
@Injectable()
export class EventLogWriter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventLogWriter.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(EVENT_LOG) private readonly eventLog: EventLog
  ) {}

  onModuleInit(): void {
    this.eventBus.registerLogSink(this.eventLog);
    this.logger.log(`Persistent EventLog sink registered (${this.eventLog.constructor.name}).`);
  }

  onModuleDestroy(): void {
    this.eventBus.unregisterLogSink(this.eventLog);
  }
}
