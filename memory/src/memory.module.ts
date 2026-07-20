import { Module } from '@nestjs/common';
import { MemoryManager } from './memory-manager';
import { ConversationManager } from './conversation-manager';

@Module({
  providers: [MemoryManager, ConversationManager],
  exports: [MemoryManager, ConversationManager],
})
export class MemoryModule {}
