import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MissionEngine } from './mission-engine.js';
import { MissionManager } from './mission-manager.js';
import { MissionRegistry } from './mission-registry.js';
import { MissionScheduler } from './mission-scheduler.js';
import { MissionCheckpoints } from './mission-checkpoints.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [MissionEngine, MissionManager, MissionRegistry, MissionScheduler, MissionCheckpoints],
  exports: [MissionEngine, MissionManager, MissionRegistry, MissionScheduler, MissionCheckpoints],
})
export class MissionModule {}
