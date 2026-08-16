export enum MessageType {
  TASK_REQUEST = "task.request",
  TASK_RESPONSE = "task.response",
  DELEGATION = "delegation",
  STATUS_UPDATE = "status.update",
  APPROVAL_REQUEST = "approval.request",
  APPROVAL_RESPONSE = "approval.response",
  QUESTION = "question",
  ANSWER = "answer",
  NOTIFICATION = "notification",
  SYSTEM_EVENT = "system.event",
  HEARTBEAT = "heartbeat",
  ERROR = "error",
}

export enum MessagePriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum MessageStatus {
  CREATED = "created",
  QUEUED = "queued",
  DELIVERED = "delivered",
  ACKNOWLEDGED = "acknowledged",
  COMPLETED = "completed",
  EXPIRED = "expired",
  FAILED = "failed",
}

export interface Message {
  id: string;
  correlationId: string;
  sender: string;
  recipient: string;
  orgId: string;
  departmentId: string;
  type: MessageType;
  priority: MessagePriority;
  timestamp: string;
  payload: any;
  metadata: Record<string, any>;
  status: MessageStatus;
}
