var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MissionRecoveryService_1;
import { Injectable, Logger } from '@nestjs/common';
import { MissionManager } from './mission-manager.js';
/**
 * Recovers missions that were interrupted by a process restart.
 *
 * On application bootstrap the service scans the durable mission repository
 * for missions still in an in-flight state (running, paused, retrying,
 * scheduled) and marks them as recovered so operators can decide whether to
 * resume or abandon them. Because missions are persisted durably, no mission
 * is lost when the runtime restarts.
 */
let MissionRecoveryService = MissionRecoveryService_1 = class MissionRecoveryService {
    missionManager;
    logger = new Logger(MissionRecoveryService_1.name);
    constructor(missionManager) {
        this.missionManager = missionManager;
    }
    async onApplicationBootstrap() {
        try {
            const recovered = await this.missionManager.recoverInterrupted();
            this.logger.log(`Mission recovery completed: ${recovered.length} interrupted mission(s) recovered.`);
        }
        catch (error) {
            this.logger.error('Mission recovery failed during bootstrap.', error);
        }
    }
    /**
     * Manually triggers mission recovery. Returns the recovered missions.
     */
    async recover(tenantId) {
        return this.missionManager.recoverInterrupted(tenantId);
    }
};
MissionRecoveryService = MissionRecoveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MissionManager])
], MissionRecoveryService);
export { MissionRecoveryService };
