import { Module, OnModuleInit } from '@nestjs/common';
import { MemoryManager } from './memory-manager.js';
import { ConversationManager } from './conversation-manager.js';
import { KnowledgeService } from './knowledge.service.js';
import { PrismaMemoryPersistence } from './prisma-memory-persistence.js';
import { PgVectorAdapter } from './pgvector-adapter.js';
import { GeminiEmbeddingProvider } from './gemini-embedding-provider.js';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [
    MemoryManager, 
    ConversationManager, 
    KnowledgeService,
    PrismaMemoryPersistence,
    {
      provide: GeminiEmbeddingProvider,
      useFactory: () => {
        return new GeminiEmbeddingProvider(process.env.GEMINI_API_KEY || '');
      }
    },
    {
      provide: PgVectorAdapter,
      useFactory: (prisma: any, embedding: GeminiEmbeddingProvider) => {
        return new PgVectorAdapter(prisma, embedding);
      },
      inject: ['PrismaService', GeminiEmbeddingProvider],
    }
  ],
  exports: [MemoryManager, ConversationManager, KnowledgeService, PrismaMemoryPersistence, PgVectorAdapter, GeminiEmbeddingProvider],
})
export class MemoryModule implements OnModuleInit {
  constructor(
    private readonly manager: MemoryManager,
    private readonly persistence: PrismaMemoryPersistence,
    private readonly vectorAdapter: PgVectorAdapter
  ) {}

  onModuleInit() {
    this.manager.setPersistence(this.persistence);
    this.manager.setVectorAdapter(this.vectorAdapter);
  }
}
