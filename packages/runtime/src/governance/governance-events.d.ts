import { RuntimeEvent } from "../events/runtime.events.js";
export declare enum GovernanceEventType {
  POLICY_CREATED = "policy.created",
  POLICY_UPDATED = "policy.updated",
  POLICY_DELETED = "policy.deleted",
  POLICY_EVALUATED = "policy.evaluated",
  APPROVAL_REQUESTED = "approval.requested",
  APPROVAL_GRANTED = "approval.granted",
  APPROVAL_DENIED = "approval.denied",
  APPROVAL_EXPIRED = "approval.expired",
  AUDIT_RECORD_CREATED = "audit.record.created",
  COMPLIANCE_VALIDATED = "compliance.validated",
  COMPLIANCE_FAILED = "compliance.failed",
  RISK_DETECTED = "risk.detected",
  RISK_RESOLVED = "risk.resolved",
  HUMAN_REVIEW_STARTED = "human.review.started",
  HUMAN_REVIEW_COMPLETED = "human.review.completed",
  EXECUTIVE_OVERRIDE = "executive.override",
}
export declare class GovernanceEvent extends RuntimeEvent {}
//# sourceMappingURL=governance-events.d.ts.map
