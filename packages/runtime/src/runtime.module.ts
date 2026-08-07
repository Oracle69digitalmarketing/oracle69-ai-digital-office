import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RuntimeManager } from './runtime-manager.js';
import { AgentRegistry } from './agent-registry.js';
import { PlanningEngine } from './planner/planning-engine.js';
import { WorkflowEngine } from './workflow/workflow-engine.js';
import { 
  CheckpointManager, 
  RetryManager, 
  CompensationManager, 
  ApprovalManager 
} from './workflow/workflow-managers.js';
import { ToolRouter } from './tools/tool-router.js';
import { ToolRegistry } from './tools/tool-registry.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
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
    ToolRegistry
  ],
  exports: [
    RuntimeManager, 
    AgentRegistry, 
    PlanningEngine,
    WorkflowEngine,
    ToolRouter,
    ToolRegistry
  ],
})
export class RuntimeModule {}
