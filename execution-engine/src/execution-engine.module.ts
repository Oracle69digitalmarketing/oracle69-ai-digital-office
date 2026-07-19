import { Module } from '@nestjs/common';
import { ExecutionEngine } from './execution-engine';

@Module({
  providers: [ExecutionEngine],
  exports: [ExecutionEngine],
})
export class ExecutionEngineModule {}
