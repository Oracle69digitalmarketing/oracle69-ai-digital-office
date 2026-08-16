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
import { MissionManager } from './mission-manager.js';
import { PlanningEngine } from '../planner/planning-engine.js';
import { WorkflowEngine } from '../workflow/workflow-engine.js';
import { TenantContextService } from '../tenancy/tenant-context.js';
/**
 * Orchestrates mission execution across planning, workflow and the durable
 * mission store, propagating tenant context so every downstream step is
 * tenant-scoped.
 */
let MissionEngine = MissionEngine_1 = class MissionEngine {
    missionManager;
    planningEngine;
    workflowEngine;
    tenantContext;
    logger = new Logger(MissionEngine_1.name);
    constructor(missionManager, planningEngine, workflowEngine, tenantContext) {
        this.missionManager = missionManager;
        this.planningEngine = planningEngine;
        this.workflowEngine = workflowEngine;
        this.tenantContext = tenantContext;
    }
    /**
     * Initializes a mission, running the initialization work within the mission
     * tenant scope so all downstream events and executions inherit the tenant
     * and mission identifiers.
     */
    async initializeMission(missionId, options = {}) {
        const tenantId = options.mission?.tenantId ?? options.tenantId ?? this.tenantContext?.getTenantId() ?? 'system';
        const run = async () => {
            this.logger.log(`Initializing mission ${missionId} for tenant ${tenantId}`);
        };
        if (this.tenantContext) {
            return this.tenantContext.run({ tenantId, missionId }, run);
        }
        return run();
    }
};
MissionEngine = MissionEngine_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MissionManager,
        PlanningEngine,
        WorkflowEngine,
        TenantContextService])
], MissionEngine);
export { MissionEngine };
