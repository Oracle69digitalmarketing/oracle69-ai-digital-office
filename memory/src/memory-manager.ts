import { Injectable, Logger } from '@nestjs/common';
import { MemoryRecord } from '@oracle69/shared';

export interface IMemoryPersistence {
  save(record: MemoryRecord): Promise<void>;
  search(query: string, limit: number): Promise<MemoryRecord[]>;
}

@Injectable()
export class MemoryManager {
  private readonly logger = new Logger(MemoryManager.name);
  
  // Transient session memory
  private sessionMemory: Map<string, MemoryRecord[]> = new Map();
  
  // Active task context (working memory)
  private workingMemory: Map<string, MemoryRecord[]> = new Map();
  
  private persistence?: IMemoryPersistence;

  setPersistence(persistence: IMemoryPersistence) {
    this.persistence = persistence;
  }

  async saveSession(sessionId: string, content: any, metadata: Record<string, any> = {}) {
    const record: MemoryRecord = {
      id: Math.random().toString(36).substring(7),
      type: 'session',
      sessionId,
      content,
      metadata,
      timestamp: new Date(),
    };

    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, []);
    }
    this.sessionMemory.get(sessionId)?.push(record);
    this.logger.debug(`Saved session memory: ${sessionId}`);
  }

  async saveWorkingContext(taskId: string, sessionId: string, content: any) {
    const record: MemoryRecord = {
      id: Math.random().toString(36).substring(7),
      type: 'working',
      sessionId,
      content,
      metadata: { taskId },
      timestamp: new Date(),
    };

    if (!this.workingMemory.has(taskId)) {
      this.workingMemory.set(taskId, []);
    }
    this.workingMemory.get(taskId)?.push(record);
    this.logger.debug(`Saved working memory for task: ${taskId}`);
  }

  async getSessionContext(sessionId: string): Promise<MemoryRecord[]> {
    return this.sessionMemory.get(sessionId) || [];
  }

  async getWorkingContext(taskId: string): Promise<MemoryRecord[]> {
    return this.workingMemory.get(taskId) || [];
  }

  async persistToLongTerm(sessionId: string) {
    if (!this.persistence) {
      this.logger.warn('No persistence layer defined for long-term memory');
      return;
    }
    this.logger.log(`Persisting session ${sessionId} to long-term memory...`);
    const records = await this.getSessionContext(sessionId);
    for (const record of records) {
        await this.persistence.save(record);
    }
  }

  async clearWorkingContext(taskId: string) {
    this.workingMemory.delete(taskId);
  }
}
