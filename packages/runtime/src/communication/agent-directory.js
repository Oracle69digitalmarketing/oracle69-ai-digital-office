var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AgentDirectory_1;
import { Injectable, Logger } from '@nestjs/common';
let AgentDirectory = AgentDirectory_1 = class AgentDirectory {
    logger = new Logger(AgentDirectory_1.name);
    agents = new Map();
    register(metadata) {
        this.agents.set(metadata.id, metadata);
        this.logger.log(`Agent registered: ${metadata.id}`);
    }
    unregister(id) {
        this.agents.delete(id);
        this.logger.log(`Agent unregistered: ${id}`);
    }
    lookup(id) {
        return this.agents.get(id);
    }
    findByDepartment(deptId) {
        return Array.from(this.agents.values()).filter(a => a.metadata?.departmentId === deptId);
    }
    findByCapability(capability) {
        return Array.from(this.agents.values()).filter(a => a.capabilities?.includes(capability));
    }
    findAvailable() {
        return Array.from(this.agents.values()); // Simplified
    }
    heartbeat(id) {
        this.logger.debug(`Heartbeat received from ${id}`);
    }
};
AgentDirectory = AgentDirectory_1 = __decorate([
    Injectable()
], AgentDirectory);
export { AgentDirectory };
