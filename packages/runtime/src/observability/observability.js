var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLogger_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';
let AuditLogger = AuditLogger_1 = class AuditLogger {
    eventEmitter;
    logger = new Logger(AuditLogger_1.name);
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    logEntry(entry) {
        this.logger.log(`Audit: ${JSON.stringify(entry)}`);
        this.eventEmitter.emit(RuntimeEventType.AUDIT_ENTRY_CREATED, new RuntimeEvent(RuntimeEventType.AUDIT_ENTRY_CREATED, entry));
    }
};
AuditLogger = AuditLogger_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], AuditLogger);
export { AuditLogger };
let MetricsCollector = class MetricsCollector {
    recordMetric(name, value) {
        // Logic to aggregate metrics
    }
};
MetricsCollector = __decorate([
    Injectable()
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
//# sourceMappingURL=observability.js.map