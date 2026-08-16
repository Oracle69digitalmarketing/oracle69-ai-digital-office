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
import { RuntimeEvent } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';
/**
 * Compatibility facade over the canonical {@link EventBus}.
 *
 * Retained so existing consumers (enterprise intelligence packages) can keep
 * publishing through the `MessageBus.publish(type, payload)` contract while all
 * events are routed through the single canonical runtime event pipeline.
 */
let MessageBus = class MessageBus {
    eventBus;
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    publish(event, payload = {}, metadata = {}) {
        if (payload instanceof RuntimeEvent) {
            this.eventBus.publish(payload);
        }
        else {
            this.eventBus.publish(event, payload, metadata);
        }
    }
};
MessageBus = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventBus])
], MessageBus);
export { MessageBus };
