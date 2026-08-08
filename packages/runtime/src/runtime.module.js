var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RuntimeManager } from './runtime-manager.js';
import { AgentRegistry } from './agent-registry.js';
import { PlanningEngine } from './planner/planning-engine.js';
import { WorkflowEngine } from './workflow/workflow-engine.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager } from './workflow/workflow-managers.js';
import { ToolRouter } from './tools/tool-router.js';
import { ToolRegistry } from './tools/tool-registry.js';
import { MemoryManager } from './memory/memory-manager.js';
import { ContextManager } from './memory/context-manager.js';
import { AuditLogger, MetricsCollector, HealthMonitor } from './observability/observability.js';
import { CommunicationModule } from './communication/communication.module.js';
import { DepartmentModule } from './departments/department.module.js';
import { ExecutiveModule } from './executive/executive.module.js';
import { MissionModule } from './missions/mission.module.js';
import { GovernanceModule } from './governance/governance.module.js';
let RuntimeModule = class RuntimeModule {
};
RuntimeModule = __decorate([
    Module({
        imports: [EventEmitterModule.forRoot(), CommunicationModule, DepartmentModule, ExecutiveModule, MissionModule, GovernanceModule],
        providers: [
            RuntimeManager,
            AgentRegistry,
            PlanningEngine,
            WorkflowEngine,
            CheckpointManager,
            RetryManager,
            CompensationManager,
            ApprovalManager,
            ToolRouter,
            ToolRegistry,
            MemoryManager,
            ContextManager,
            AuditLogger,
            MetricsCollector,
            HealthMonitor
        ],
        exports: [
            RuntimeManager,
            AgentRegistry,
            PlanningEngine,
            WorkflowEngine,
            ToolRouter,
            ToolRegistry,
            MemoryManager,
            ContextManager,
            AuditLogger,
            MetricsCollector,
            HealthMonitor,
            CommunicationModule,
            DepartmentModule,
            ExecutiveModule,
            MissionModule,
            GovernanceModule
        ],
    })
], RuntimeModule);
export { RuntimeModule };
//# sourceMappingURL=runtime.module.js.map