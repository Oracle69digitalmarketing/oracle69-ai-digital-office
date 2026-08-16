var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLogger_1, MetricsCollector_1;
import { Injectable, Logger } from '@nestjs/common';
import { RuntimeEventType } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';
let AuditLogger = AuditLogger_1 = class AuditLogger {
    eventBus;
    logger = new Logger(AuditLogger_1.name);
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    logEntry(entry) {
        this.logger.log(`Audit: ${JSON.stringify(entry)}`);
        this.eventBus.publish(RuntimeEventType.AUDIT_ENTRY_CREATED, { entry }, { source: 'AuditLogger' });
    }
};
AuditLogger = AuditLogger_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventBus])
], AuditLogger);
export { AuditLogger };
let MetricsCollector = MetricsCollector_1 = class MetricsCollector {
    eventBus;
    logger = new Logger(MetricsCollector_1.name);
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    recordMetric(name, value) {
        this.logger.debug(`Metric recorded: ${name}=${value}`);
        this.eventBus?.publish(RuntimeEventType.RUNTIME_METRIC_RECORDED, { name, value }, { source: 'MetricsCollector' });
    }
};
MetricsCollector = MetricsCollector_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventBus])
], MetricsCollector);
export { MetricsCollector };
let HealthMonitor = class HealthMonitor {
    checkStatus() {
        return 'healthy';
    }
};
HealthMonitor = __decorate([
    Injectable()
], HealthMonitor);
export { HealthMonitor };
