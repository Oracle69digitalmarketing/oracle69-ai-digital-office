var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AgentRegistry } from '../agent-registry.js';
import { PlanningEngine } from '../planner/planning-engine.js';
import { WorkflowEngine } from '../workflow/workflow-engine.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager, } from '../workflow/workflow-managers.js';
/**
 * Provides the orchestration services (planning, workflow and their
 * dependencies) shared by the {@link RuntimeModule} and the
 * {@link MissionModule}.
 *
 * Mission orchestration depends on both `PlanningEngine` and `WorkflowEngine`;
 * hosting them here lets every consuming module resolve the same singletons
 * without duplicating instances.
 */
let OrchestrationModule = class OrchestrationModule {
};
OrchestrationModule = __decorate([
    Module({
        providers: [
            AgentRegistry,
            PlanningEngine,
            WorkflowEngine,
            CheckpointManager,
            RetryManager,
            CompensationManager,
            ApprovalManager,
        ],
        exports: [
            AgentRegistry,
            PlanningEngine,
            WorkflowEngine,
            CheckpointManager,
            RetryManager,
            CompensationManager,
            ApprovalManager,
        ],
    })
], OrchestrationModule);
export { OrchestrationModule };
