export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskContext {
  taskId: string;
  projectId: string;
  sessionId: string;
  priority: Priority;
  deadline?: Date;
  context: Record<string, any>;
  objective: string;
  attachments?: string[];
  references?: string[];
  constraints?: string[];
  expectedDeliverable?: string;
}

export type AgentStatus = 'offline' | 'idle' | 'busy' | 'waiting' | 'blocked' | 'error' | 'maintenance';

export interface AgentMetadata {
  id: string;
  name: string;
  role: string;
  description: string;
  version: string;
  capabilities: string[];
  permissions: string[];
  supportedModels: ModelTier[];
  healthStatus: AgentStatus;
}

export type ModelTier = 'nano' | 'mini' | 'gpt-5.6';

export interface ModelRoutingRequest {
  taskId: string;
  taskDescription: string;
  department: string;
  complexity: number;
  businessRisk?: 'low' | 'medium' | 'high';
}

export interface ModelUsage {
  taskId: string;
  agentId: string;
  model: string;
  tokensUsed: number;
  cost: number;
  duration: number;
}

export interface WorkflowTrace {
  workflowId: string;
  steps: WorkflowStep[];
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface WorkflowStep {
  stepId: string;
  taskId: string;
  agentId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

export interface DomainEvent<T = any> {
  eventId: string;
  timestamp: Date;
  type: string;
  payload: T;
  source: string;
}

export interface MemoryRecord {
  id: string;
  type: 'session' | 'working' | 'long-term';
  sessionId: string;
  content: any;
  metadata: Record<string, any>;
  timestamp: Date;
}
