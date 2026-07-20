import { Injectable, Logger } from '@nestjs/common';
import { MemoryManager } from './memory-manager.js';
import { MemoryRecord } from '@oracle69/shared';

@Injectable()
export class ConversationManager {
  private readonly logger = new Logger(ConversationManager.name);

  constructor(private memory: MemoryManager) {}

  async buildContext(sessionId: string, maxTokens: number = 4000): Promise<string> {
    const history = await this.memory.getSessionContext(sessionId);
    
    // Simple token estimation: ~4 chars per token
    let currentTokens = 0;
    const contextLines: string[] = [];

    // Process from newest to oldest
    for (const record of history.reverse()) {
      const line = `${record.metadata.role || 'user'}: ${JSON.stringify(record.content)}`;
      const estimatedTokens = Math.ceil(line.length / 4);

      if (currentTokens + estimatedTokens > maxTokens) {
        this.logger.debug(`Context limit reached for ${sessionId}. Compressing...`);
        break;
      }

      contextLines.unshift(line);
      currentTokens += estimatedTokens;
    }

    return contextLines.join('\n');
  }

  async summarize(sessionId: string): Promise<string> {
    this.logger.log(`Summarizing conversation for session: ${sessionId}`);
    // This would typically involve a model call to summarize the history
    return "Summary of the conversation history.";
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
