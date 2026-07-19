export interface TaskContext {
  taskId: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  context: Record<string, any>;
}

export interface AgentMetadata {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  version: string;
}

export type ModelTier = 'nano' | 'mini' | 'gpt-5.6';

export interface ModelRoutingRequest {
  taskDescription: string;
  department: string;
  complexity: number;
}
