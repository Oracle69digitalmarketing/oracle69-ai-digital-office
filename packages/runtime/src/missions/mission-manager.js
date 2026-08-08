var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MissionManager_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MissionStatus } from './mission.types.js';
import { MissionRegistry } from './mission-registry.js';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';
let MissionManager = MissionManager_1 = class MissionManager {
    registry;
    eventEmitter;
    logger = new Logger(MissionManager_1.name);
    constructor(registry, eventEmitter) {
        this.registry = registry;
        this.eventEmitter = eventEmitter;
    }
    async createMission(mission) {
        this.registry.registerMission(mission);
        this.emit(RuntimeEventType.MISSION_CREATED, { missionId: mission.id });
    }
    async startMission(missionId) {
        const mission = this.registry.getMission(missionId);
        if (!mission)
            throw new Error('Mission not found');
        mission.status = MissionStatus.RUNNING;
        this.emit(RuntimeEventType.MISSION_STARTED, { missionId });
    }
    emit(type, payload) {
        this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
    }
};
MissionManager = MissionManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MissionRegistry,
        EventEmitter2])
], MissionManager);
export { MissionManager };
//# sourceMappingURL=mission-manager.js.map