var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MissionEngine } from './mission-engine.js';
import { MissionManager } from './mission-manager.js';
import { MissionRegistry } from './mission-registry.js';
import { MissionScheduler } from './mission-scheduler.js';
import { MissionCheckpoints } from './mission-checkpoints.js';
let MissionModule = class MissionModule {
};
MissionModule = __decorate([
    Module({
        imports: [EventEmitterModule.forRoot()],
        providers: [MissionEngine, MissionManager, MissionRegistry, MissionScheduler, MissionCheckpoints],
        exports: [MissionEngine, MissionManager, MissionRegistry, MissionScheduler, MissionCheckpoints],
    })
], MissionModule);
export { MissionModule };
//# sourceMappingURL=mission.module.js.map