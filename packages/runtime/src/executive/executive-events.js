import { RuntimeEvent } from '../events/runtime.events.js';
export var ExecutiveEventType;
(function (ExecutiveEventType) {
    ExecutiveEventType["EXECUTIVE_REGISTERED"] = "executive.registered";
    ExecutiveEventType["EXECUTIVE_GOAL_CREATED"] = "executive.goal.created";
    ExecutiveEventType["EXECUTIVE_GOAL_APPROVED"] = "executive.goal.approved";
    ExecutiveEventType["EXECUTIVE_GOAL_REJECTED"] = "executive.goal.rejected";
    ExecutiveEventType["EXECUTIVE_REVIEW_STARTED"] = "executive.review.started";
    ExecutiveEventType["EXECUTIVE_REVIEW_COMPLETED"] = "executive.review.completed";
    ExecutiveEventType["ENTERPRISE_COORDINATION_STARTED"] = "enterprise.coordination.started";
    ExecutiveEventType["ENTERPRISE_COORDINATION_COMPLETED"] = "enterprise.coordination.completed";
    ExecutiveEventType["ENTERPRISE_CONFLICT_DETECTED"] = "enterprise.conflict.detected";
    ExecutiveEventType["ENTERPRISE_CONFLICT_RESOLVED"] = "enterprise.conflict.resolved";
    ExecutiveEventType["DEPARTMENT_REPORT_RECEIVED"] = "department.report.received";
})(ExecutiveEventType || (ExecutiveEventType = {}));
export class ExecutiveEvent extends RuntimeEvent {
}
//# sourceMappingURL=executive-events.js.map