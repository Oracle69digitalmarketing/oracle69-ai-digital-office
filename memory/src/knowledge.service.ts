import { Injectable, Logger } from '@nestjs/common';
import { MemoryManager } from './memory-manager.js';
import { MemoryRecord } from '@oracle69/shared';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private readonly memory: MemoryManager) {}

  async getRelevantContext(query: string, options: {
    organizationId: string;
    limit?: number;
    sessionId?: string;
  }): Promise<string> {
    this.logger.debug(`Retrieving knowledge for: ${query.substring(0, 50)}...`);
    
    // 1. Semantic retrieval
    const semanticMemories = await this.memory.searchSemantic(query, options.limit || 5);
    
    // 2. Format results
    if (semanticMemories.length === 0) {
      return "No relevant organizational knowledge found.";
    }

    const contextParts = semanticMemories.map((m, i) => {
      const metadata = m.metadata || {};
      return `[Memory #${i+1}] (Role: ${metadata.role || 'unknown'}, Date: ${m.timestamp?.toISOString() || 'unknown'})\nContent: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}\nReasoning: ${metadata.reasoning || 'N/A'}`;
    });

    return `Relevant Organizational Knowledge:\n${contextParts.join('\n\n')}`;
  }
}
