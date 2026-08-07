import { Injectable, Logger, Optional } from '@nestjs/common';
import { MemoryRecord } from '@oracle69/shared';

export interface IMemoryPersistence {
  save(record: MemoryRecord): Promise<string>;
  search(query: string, limit: number): Promise<MemoryRecord[]>;
}

export interface MemoryConfig {
  longTermPersistenceEnabled: boolean;
}

export interface VectorMemoryAdapter {
  embed(text: string): Promise<number[]>;
  upsert(id: string, vector: number[], metadata: any): Promise<void>;
  similaritySearch(vector: number[], limit: number): Promise<any[]>;
}

@Injectable()
export class MemoryManager {
  private readonly logger = new Logger(MemoryManager.name);
  
  // Transient session memory
  private sessionMemory: Map<string, MemoryRecord[]> = new Map();
  
  // Active task context (working memory)
  private workingMemory: Map<string, MemoryRecord[]> = new Map();
  
  private persistence?: IMemoryPersistence;
  private vectorAdapter?: VectorMemoryAdapter;

  constructor(@Optional() private readonly config?: MemoryConfig) {}

  setPersistence(persistence: IMemoryPersistence) {
    this.persistence = persistence;
  }

  setVectorAdapter(adapter: VectorMemoryAdapter) {
    this.vectorAdapter = adapter;
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

  async saveBusinessMemory(data: {
    sessionId: string;
    taskId: string;
    agentId: string;
    role: string;
    content: any;
    reasoning?: string;
    decisions?: string[];
    metadata?: Record<string, any>;
    organizationId?: string;
  }) {
    const record: MemoryRecord = {
      id: Math.random().toString(36).substring(7),
      type: 'long-term',
      sessionId: data.sessionId,
      content: data.content,
      metadata: {
        ...data.metadata,
        taskId: data.taskId,
        agentId: data.agentId,
        role: data.role,
        reasoning: data.reasoning,
        decisions: data.decisions,
        organizationId: data.organizationId || 'system',
        persistent: true,
      },
      timestamp: new Date(),
    };

    if (this.persistence) {
      const savedId = await this.persistence.save(record);
      this.logger.log(`Persisted business memory for task ${data.taskId}`);

      if (this.vectorAdapter) {
        try {
          const contentToEmbed = typeof data.content === 'string' 
            ? data.content 
            : `${data.reasoning || ''} ${JSON.stringify(data.content)}`;
          
          const vector = await this.vectorAdapter.embed(contentToEmbed);
          await this.vectorAdapter.upsert(savedId, vector, record.metadata);
          this.logger.log(`Generated and stored embedding for task ${data.taskId}`);
        } catch (error) {
          this.logger.error(`Failed to generate/store embedding for task ${data.taskId}`, error);
        }
      }
    } else {
      this.logger.warn(`Persistence layer not available, business memory for task ${data.taskId} not saved to DB`);
      // Fallback to session memory for now
      await this.saveSession(data.sessionId, record.content, record.metadata);
    }
  }

  async getSessionContext(sessionId: string): Promise<MemoryRecord[]> {
    return this.sessionMemory.get(sessionId) || [];
  }

  async getWorkingContext(taskId: string): Promise<MemoryRecord[]> {
    return this.workingMemory.get(taskId) || [];
  }

  async persistToLongTerm(sessionId: string) {
    if (!this.config?.longTermPersistenceEnabled) {
      this.logger.warn('Long-term memory persistence is disabled by configuration');
      return;
    }

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

  async searchSemantic(query: string, limit: number = 5): Promise<MemoryRecord[]> {
    if (!this.vectorAdapter) {
      this.logger.warn('Vector adapter not configured, semantic search skipped.');
      return [];
    }

    try {
      const vector = await this.vectorAdapter.embed(query);
      const results = await this.vectorAdapter.similaritySearch(vector, limit);
      
      return results.map(r => ({
        id: r.id,
        type: 'long-term',
        sessionId: r.sessionId,
        content: r.content,
        metadata: r.metadata || {},
        timestamp: r.timestamp
      }));
    } catch (error) {
      this.logger.error('Semantic search failed', error);
      return [];
    }
  }
}
