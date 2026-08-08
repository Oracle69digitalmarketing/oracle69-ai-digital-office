var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MissionEngine_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MissionManager } from './mission-manager.js';
import { PlanningEngine } from '../planner/planning-engine.js';
import { WorkflowEngine } from '../workflow/workflow-engine.js';
let MissionEngine = MissionEngine_1 = class MissionEngine {
    missionManager;
    planningEngine;
    workflowEngine;
    eventEmitter;
    logger = new Logger(MissionEngine_1.name);
    constructor(missionManager, planningEngine, workflowEngine, eventEmitter) {
        this.missionManager = missionManager;
        this.planningEngine = planningEngine;
        this.workflowEngine = workflowEngine;
        this.eventEmitter = eventEmitter;
    }
    async initializeMission(missionId) {
        this.logger.log(`Initializing mission ${missionId}`);
        // Interaction logic between planning and workflow
    }
};
MissionEngine = MissionEngine_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MissionManager,
        PlanningEngine,
        WorkflowEngine,
        EventEmitter2])
], MissionEngine);
export { MissionEngine };
//# sourceMappingURL=mission-engine.js.map