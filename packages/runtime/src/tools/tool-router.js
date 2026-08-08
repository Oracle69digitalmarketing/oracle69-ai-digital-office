var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ToolRouter_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';
let ToolRouter = ToolRouter_1 = class ToolRouter {
    registry;
    eventEmitter;
    logger = new Logger(ToolRouter_1.name);
    constructor(registry, eventEmitter) {
        this.registry = registry;
        this.eventEmitter = eventEmitter;
    }
    async execute(request, context) {
        this.emit(RuntimeEventType.TOOL_EXECUTION_STARTED, { toolId: request.toolId, traceId: context.traceId });
        try {
            const connector = this.registry.resolveConnector(request.connectorId);
            this.emit(RuntimeEventType.TOOL_CONNECTOR_SELECTED, { connectorId: request.connectorId });
            // Credential injection would happen here in a real implementation
            // Execute connector (simulated)
            this.logger.log(`Executing tool ${request.toolId} via ${request.connectorId}`);
            const response = { success: true, data: { status: 'executed' } };
            this.emit(RuntimeEventType.TOOL_EXECUTION_COMPLETED, { toolId: request.toolId });
            return response;
        }
        catch (error) {
            this.emit(RuntimeEventType.TOOL_EXECUTION_FAILED, { toolId: request.toolId, error: String(error) });
            return { success: false, error: String(error) };
        }
    }
    emit(type, payload) {
        this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
    }
};
ToolRouter = ToolRouter_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object, EventEmitter2])
], ToolRouter);
export { ToolRouter };
//# sourceMappingURL=tool-router.js.map