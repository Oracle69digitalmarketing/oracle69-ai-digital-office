import { Injectable, Logger } from '@nestjs/common';
import { RuntimeEventType } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';

@Injectable()
export class AuditLogger {
  private readonly logger = new Logger(AuditLogger.name);

  constructor(private readonly eventBus: EventBus) {}

  logEntry(entry: unknown): void {
    this.logger.log(`Audit: ${JSON.stringify(entry)}`);
    this.eventBus.publish(RuntimeEventType.AUDIT_ENTRY_CREATED, { entry }, { source: 'AuditLogger' });
  }
}

@Injectable()
export class MetricsCollector {
  private readonly logger = new Logger(MetricsCollector.name);

  constructor(private readonly eventBus?: EventBus) {}

  recordMetric(name: string, value: number): void {
    this.logger.debug(`Metric recorded: ${name}=${value}`);
    this.eventBus?.publish(RuntimeEventType.RUNTIME_METRIC_RECORDED, { name, value }, { source: 'MetricsCollector' });
  }
}

@Injectable()
export class HealthMonitor {
  checkStatus(): string {
    return 'healthy';
  }
}
