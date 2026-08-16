var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ExecutiveOffice_1;
import { Injectable, Logger } from '@nestjs/common';
import { ExecutiveEventType, ExecutiveEvent } from './executive-events.js';
import { EventBus } from '../events/event-bus.js';
let ExecutiveOffice = ExecutiveOffice_1 = class ExecutiveOffice {
    eventBus;
    logger = new Logger(ExecutiveOffice_1.name);
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    async assignEnterpriseGoal(goal) {
        this.logger.log(`Assigning enterprise goal: ${goal.goal}`);
        this.eventBus.publish(new ExecutiveEvent(ExecutiveEventType.EXECUTIVE_GOAL_CREATED, { goalId: goal.id }, { source: 'ExecutiveOffice' }));
    }
    async approveMission(missionId) {
        this.logger.log(`Approving mission: ${missionId}`);
        this.eventBus.publish(new ExecutiveEvent(ExecutiveEventType.EXECUTIVE_GOAL_APPROVED, { missionId }, { source: 'ExecutiveOffice' }));
    }
};
ExecutiveOffice = ExecutiveOffice_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventBus])
], ExecutiveOffice);
export { ExecutiveOffice };
