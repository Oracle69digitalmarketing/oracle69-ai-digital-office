import { RuntimeEvent } from '../events/runtime.events.js';
export var GovernanceEventType;
(function (GovernanceEventType) {
    GovernanceEventType["POLICY_CREATED"] = "policy.created";
    GovernanceEventType["POLICY_UPDATED"] = "policy.updated";
    GovernanceEventType["POLICY_DELETED"] = "policy.deleted";
    GovernanceEventType["POLICY_EVALUATED"] = "policy.evaluated";
    GovernanceEventType["APPROVAL_REQUESTED"] = "approval.requested";
    GovernanceEventType["APPROVAL_GRANTED"] = "approval.granted";
    GovernanceEventType["APPROVAL_DENIED"] = "approval.denied";
    GovernanceEventType["APPROVAL_EXPIRED"] = "approval.expired";
    GovernanceEventType["AUDIT_RECORD_CREATED"] = "audit.record.created";
    GovernanceEventType["COMPLIANCE_VALIDATED"] = "compliance.validated";
    GovernanceEventType["COMPLIANCE_FAILED"] = "compliance.failed";
    GovernanceEventType["RISK_DETECTED"] = "risk.detected";
    GovernanceEventType["RISK_RESOLVED"] = "risk.resolved";
    GovernanceEventType["HUMAN_REVIEW_STARTED"] = "human.review.started";
    GovernanceEventType["HUMAN_REVIEW_COMPLETED"] = "human.review.completed";
    GovernanceEventType["EXECUTIVE_OVERRIDE"] = "executive.override";
})(GovernanceEventType || (GovernanceEventType = {}));
export class GovernanceEvent extends RuntimeEvent {
}
