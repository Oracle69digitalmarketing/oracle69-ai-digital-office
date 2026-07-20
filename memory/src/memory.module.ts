import { Module } from '@nestjs/common';
import { MemoryManager } from './memory-manager.js';
import { ConversationManager } from './conversation-manager.js';

@Module({
  providers: [MemoryManager, ConversationManager],
  exports: [MemoryManager, ConversationManager],
})
export class MemoryModule {}
