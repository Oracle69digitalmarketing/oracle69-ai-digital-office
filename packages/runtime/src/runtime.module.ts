import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RuntimeManager } from './runtime-manager.js';
import { AgentRegistry } from './agent-registry.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [RuntimeManager, AgentRegistry],
  exports: [RuntimeManager, AgentRegistry],
})
export class RuntimeModule {}
