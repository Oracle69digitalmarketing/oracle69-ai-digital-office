import { EventBus } from "../events/event-bus.js";
export declare class AuditLogger {
  private readonly eventBus;
  private readonly logger;
  constructor(eventBus: EventBus);
  logEntry(entry: unknown): void;
}
export declare class MetricsCollector {
  private readonly eventBus?;
  private readonly logger;
  constructor(eventBus?: EventBus | undefined);
  recordMetric(name: string, value: number): void;
}
export declare class HealthMonitor {
  checkStatus(): string;
}
//# sourceMappingURL=observability.d.ts.map
