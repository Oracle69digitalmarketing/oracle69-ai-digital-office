import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RuntimeManager } from './runtime-manager.js';
import { AgentRegistry } from './agent-registry.js';
import { PlanningEngine } from './planner/planning-engine.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [RuntimeManager, AgentRegistry, PlanningEngine],
  exports: [RuntimeManager, AgentRegistry, PlanningEngine],
})
export class RuntimeModule {}
