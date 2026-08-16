import { Priority } from "@oracle69/shared";

export type ConnectorStatus = "connected" | "disconnected" | "error" | "unauthorized";

export interface ConnectorMetadata {
  id: string;
  name: string;
  type: string;
  version: string;
  capabilities: string[];
}

export interface ConnectorHealth {
  status: ConnectorStatus;
  latency?: number;
  lastCheck: Date;
  error?: string;
}

export interface ConnectorResult<T = any> {
  success: boolean;
  data?: T;
  error?: ConnectorError;
  metadata?: Record<string, any>;
}

export interface ConnectorError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export interface ConnectorEvent {
  connectorId: string;
  type: string;
  payload: any;
  timestamp: Date;
}

export interface ConnectorActionRequest {
  action: string;
  params: Record<string, any>;
  priority?: Priority;
  organizationId: string;
  userId?: string;
}

export interface IConnector {
  metadata: ConnectorMetadata;
  connect(credentials: any): Promise<void>;
  disconnect(): Promise<void>;
  authenticate(): Promise<boolean>;
  execute(request: ConnectorActionRequest): Promise<ConnectorResult>;
  health(): Promise<ConnectorHealth>;
}
