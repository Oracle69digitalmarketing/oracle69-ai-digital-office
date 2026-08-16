var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let DepartmentManager = class DepartmentManager {
    deptId;
    eventEmitter;
    logger = new Logger(this.constructor.name);
    constructor(deptId, eventEmitter) {
        this.deptId = deptId;
        this.eventEmitter = eventEmitter;
    }
    async delegateTask(taskId, agentId) {
        this.logger.log(`Delegating task ${taskId} to agent ${agentId}`);
    }
    async generateReport() {
        return `Report for department ${this.deptId}`;
    }
};
DepartmentManager = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [String, EventEmitter2])
], DepartmentManager);
export { DepartmentManager };
