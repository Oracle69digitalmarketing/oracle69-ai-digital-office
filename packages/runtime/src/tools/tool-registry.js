var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ToolRegistry_1;
import { Injectable, Logger } from '@nestjs/common';
let ToolRegistry = ToolRegistry_1 = class ToolRegistry {
    logger = new Logger(ToolRegistry_1.name);
    connectors = new Map();
    constructor() {
        // In a real scenario, this would dynamically load connectors from Phase 5.
        // For now, we stub them.
        this.connectors.set('google-drive', { name: 'GoogleDriveConnector' });
    }
    resolveConnector(connectorId) {
        const connector = this.connectors.get(connectorId);
        if (!connector) {
            throw new Error(`Connector ${connectorId} not found`);
        }
        return connector;
    }
    validateToolAccess(agentId, toolId) {
        // Placeholder for RBAC logic
        return true;
    }
};
ToolRegistry = ToolRegistry_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ToolRegistry);
export { ToolRegistry };
//# sourceMappingURL=tool-registry.js.map