export interface Policy {
  id: string;
  name: string;
  rule: string;
  isActive: boolean;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  approverRole: string;
  status: "pending" | "granted" | "denied";
}

export interface AuditRecord {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details: any;
}
