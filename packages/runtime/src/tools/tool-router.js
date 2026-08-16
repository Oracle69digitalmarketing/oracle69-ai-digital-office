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
var ToolRouter_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RuntimeEventType } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';
import { ToolRegistry } from './tool-registry.js';
let ToolRouter = ToolRouter_1 = class ToolRouter {
    registry;
    eventBus;
    logger = new Logger(ToolRouter_1.name);
    constructor(registry, eventBus) {
        this.registry = registry;
        this.eventBus = eventBus;
    }
    async execute(request, context) {
        this.emit(RuntimeEventType.TOOL_EXECUTION_STARTED, { toolId: request.toolId, traceId: context.traceId }, { context });
        try {
            const connector = this.registry.resolveConnector(request.connectorId);
            this.emit(RuntimeEventType.TOOL_CONNECTOR_SELECTED, { connectorId: request.connectorId }, { context });
            // Credential injection would happen here in a real implementation
            // Execute connector (simulated)
            this.logger.log(`Executing tool ${request.toolId} via ${request.connectorId}`);
            const response = { success: true, data: { status: 'executed' } };
            this.emit(RuntimeEventType.TOOL_EXECUTION_COMPLETED, { toolId: request.toolId }, { context });
            return response;
        }
        catch (error) {
            this.emit(RuntimeEventType.TOOL_EXECUTION_FAILED, { toolId: request.toolId, error: String(error) }, { context });
            return { success: false, error: String(error) };
        }
    }
    emit(type, payload, options = {}) {
        this.eventBus.publish(type, payload, { source: 'ToolRouter', ...options });
    }
};
ToolRouter = ToolRouter_1 = __decorate([
    Injectable(),
    __param(0, Inject(ToolRegistry)),
    __metadata("design:paramtypes", [Object, EventBus])
], ToolRouter);
export { ToolRouter };
