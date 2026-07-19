import { Module } from '@nestjs/common';
import { MemoryManager } from './memory-manager';

@Module({
  providers: [MemoryManager],
  exports: [MemoryManager],
})
export class MemoryModule {}
