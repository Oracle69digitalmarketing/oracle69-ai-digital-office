export interface MemoryRecord {
  id: string;
  type: 'working' | 'semantic' | 'business';
  content: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface IMemoryManager {
  save(record: MemoryRecord): Promise<void>;
  retrieve(query: string): Promise<MemoryRecord[]>;
}

export interface IContextManager {
  hydrate(agentId: string, workflowId: string): Promise<Record<string, any>>;
  compress(context: Record<string, any>): Record<string, any>;
}
