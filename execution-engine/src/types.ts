import { TaskContext } from "@oracle69/shared";

export interface AgentRequest {
  taskId: string;
  sessionId: string;
  context: TaskContext;
  organizationId: string;
}

export interface AgentResponse<T = any> {
  taskId: string;
  agentId: string;
  status: "success" | "failure";
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}
