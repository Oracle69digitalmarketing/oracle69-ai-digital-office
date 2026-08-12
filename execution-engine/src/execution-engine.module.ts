import { Module } from '@nestjs/common';
import { ExecutionEngine } from './execution-engine.js';
import { PrismaWorkflowTraceRepository } from './prisma-workflow-trace-repository.js';
import { MemoryModule } from '@oracle69/memory';

@Module({
  imports: [MemoryModule],
  providers: [ExecutionEngine, PrismaWorkflowTraceRepository],
  exports: [ExecutionEngine, PrismaWorkflowTraceRepository],
})
export class ExecutionEngineModule {}
