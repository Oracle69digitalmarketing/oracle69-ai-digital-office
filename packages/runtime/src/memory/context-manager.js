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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';
let ContextManager = class ContextManager {
    eventEmitter;
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async hydrate(agentId, workflowId) {
        this.emit(RuntimeEventType.CONTEXT_LOADED, { agentId, workflowId });
        return { agentId, workflowId, data: {} };
    }
    compress(context) {
        this.emit(RuntimeEventType.CONTEXT_COMPRESSED, {});
        return { ...context, compressed: true };
    }
    emit(type, payload) {
        this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
    }
};
ContextManager = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], ContextManager);
export { ContextManager };
//# sourceMappingURL=context-manager.js.map