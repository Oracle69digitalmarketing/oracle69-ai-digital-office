import { RuntimeEvent } from '../events/runtime.events.js';
export declare enum ExecutiveEventType {
    EXECUTIVE_REGISTERED = "executive.registered",
    EXECUTIVE_GOAL_CREATED = "executive.goal.created",
    EXECUTIVE_GOAL_APPROVED = "executive.goal.approved",
    EXECUTIVE_GOAL_REJECTED = "executive.goal.rejected",
    EXECUTIVE_REVIEW_STARTED = "executive.review.started",
    EXECUTIVE_REVIEW_COMPLETED = "executive.review.completed",
    ENTERPRISE_COORDINATION_STARTED = "enterprise.coordination.started",
    ENTERPRISE_COORDINATION_COMPLETED = "enterprise.coordination.completed",
    ENTERPRISE_CONFLICT_DETECTED = "enterprise.conflict.detected",
    ENTERPRISE_CONFLICT_RESOLVED = "enterprise.conflict.resolved",
    DEPARTMENT_REPORT_RECEIVED = "department.report.received"
}
export declare class ExecutiveEvent extends RuntimeEvent {
}
//# sourceMappingURL=executive-events.d.ts.map