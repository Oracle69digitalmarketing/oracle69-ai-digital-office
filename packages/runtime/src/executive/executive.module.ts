import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ExecutiveOffice } from './executive-office.js';
import { ExecutiveRegistry } from './executive-registry.js';
import { ExecutiveCoordinator } from './executive-coordinator.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [ExecutiveOffice, ExecutiveRegistry, ExecutiveCoordinator],
  exports: [ExecutiveOffice, ExecutiveRegistry, ExecutiveCoordinator],
})
export class ExecutiveModule {}
