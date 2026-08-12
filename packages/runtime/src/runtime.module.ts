import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module.js';
import { PersistenceModule } from './persistence/persistence.module.js';
import { OrchestrationModule } from './orchestration/orchestration.module.js';
import { RuntimeManager } from './runtime-manager.js';
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

@Module({
  imports: [
    EventsModule,
    PersistenceModule,
    OrchestrationModule,
    CommunicationModule,
    DepartmentModule,
    ExecutiveModule,
    MissionModule,
    GovernanceModule,
  ],
  providers: [
    RuntimeManager,
    ToolRouter,
    ToolRegistry,
    MemoryManager,
    ContextManager,
    AuditLogger,
    MetricsCollector,
    HealthMonitor,
  ],
  exports: [
    EventsModule,
    OrchestrationModule,
    RuntimeManager,
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
    GovernanceModule,
  ],
})
export class RuntimeModule {}
