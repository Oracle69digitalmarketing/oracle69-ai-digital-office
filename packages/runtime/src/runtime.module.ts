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
    ApprovalManager
  ],
  exports: [
    RuntimeManager, 
    AgentRegistry, 
    PlanningEngine,
    WorkflowEngine
  ],
})
export class RuntimeModule {}
