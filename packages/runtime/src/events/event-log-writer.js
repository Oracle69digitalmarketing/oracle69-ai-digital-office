var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventLogWriter_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from './event-bus.js';
import { EVENT_LOG } from './event-log.js';
/**
 * Wires a persistent {@link EventLog} into the canonical {@link EventBus} as
 * an {@link EventLogSink} so every published event is recorded exactly once.
 *
 * Registered on module init and removed on module destroy so the recorder does
 * not outlive the application.
 */
let EventLogWriter = EventLogWriter_1 = class EventLogWriter {
    eventBus;
    eventLog;
    logger = new Logger(EventLogWriter_1.name);
    constructor(eventBus, eventLog) {
        this.eventBus = eventBus;
        this.eventLog = eventLog;
    }
    onModuleInit() {
        this.eventBus.registerLogSink(this.eventLog);
        this.logger.log(`Persistent EventLog sink registered (${this.eventLog.constructor.name}).`);
    }
    onModuleDestroy() {
        this.eventBus.unregisterLogSink(this.eventLog);
    }
};
EventLogWriter = EventLogWriter_1 = __decorate([
    Injectable(),
    __param(1, Inject(EVENT_LOG)),
    __metadata("design:paramtypes", [EventBus, Object])
], EventLogWriter);
export { EventLogWriter };
