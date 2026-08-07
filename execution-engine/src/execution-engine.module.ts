import { Module } from '@nestjs/common';
import { ExecutionEngine } from './execution-engine.js';
import { MemoryModule } from '@oracle69/memory';

@Module({
  imports: [MemoryModule],
  providers: [ExecutionEngine],
  exports: [ExecutionEngine],
})
export class ExecutionEngineModule {}
