var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { RuntimeEventType } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';
let MemoryManager = class MemoryManager {
    eventBus;
    storage = new Map();
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    async save(record) {
        this.storage.set(record.id, record);
        this.emit(RuntimeEventType.MEMORY_CREATED, { id: record.id, type: record.type });
    }
    async retrieve(query) {
        const results = Array.from(this.storage.values()).filter(r => JSON.stringify(r).includes(query));
        this.emit(RuntimeEventType.MEMORY_RETRIEVED, { query, count: results.length });
        return results;
    }
    emit(type, payload) {
        this.eventBus.publish(type, payload, { source: 'MemoryManager' });
    }
};
MemoryManager = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventBus])
], MemoryManager);
export { MemoryManager };
