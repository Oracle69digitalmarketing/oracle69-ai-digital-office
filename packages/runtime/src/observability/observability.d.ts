import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class AuditLogger {
    private readonly eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    logEntry(entry: any): void;
}
export declare class MetricsCollector {
    recordMetric(name: string, value: number): void;
}
export declare class HealthMonitor {
    checkStatus(): string;
}
//# sourceMappingURL=observability.d.ts.map