export type EventCatalog =
  | "task.delegated"
  | "task.escalated"
  | "task.completed"
  | "task.created"
  | "task.started"
  | "task.failed"
  | "task.status_changed"
  | "project.created"
  | "department.handoff"
  | "agent.registered"
  | "agent.status_changed"
  | "connector.action.started"
  | "connector.action.completed"
  | "connector.action.failed"
  | "workflow.step.started"
  | "workflow.step.completed"
  | "workflow.step.failed"
  | "audit.action.executed";

export interface ProvisioningRequest {
  organizationId: string;
  name: string;
  industry?: string;
  country?: string;
  timezone?: string;
  adminEmail: string;
}

export interface ProvisioningResult {
  organizationId: string;
  status: "success" | "failed";
  apiKey: string;
  receptionistAgentId: string;
}

export interface EnterpriseEvent<T = any> {
  eventId: string;
  timestamp: Date;
  type: EventCatalog;
  payload: T;
  source: string;
  organizationId: string;
}

export interface MemoryQueryRequest {
  organizationId: string;
  query: string;
  sessionId?: string;
  limit?: number;
}

export interface MemoryQueryResponse {
  results: Array<{
    id: string;
    content: any;
    metadata: Record<string, any>;
    timestamp: Date;
  }>;
}

export interface DepartmentCapabilityManifest {
  departmentId: string;
  name: string;
  capabilities: string[];
  kpis: string[];
}

export interface TenantContext {
  organizationId: string;
  productIdentifier: string;
}
