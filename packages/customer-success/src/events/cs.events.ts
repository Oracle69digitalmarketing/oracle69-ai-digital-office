import { RuntimeEvent } from "@oracle69/runtime";

/**
 * Enumeration of all Customer Success-related event types.
 */
export enum CustomerSuccessEventType {
  HEALTH_UPDATED = "cs.health.updated",
  HEALTH_DETERIORATED = "cs.health.deteriorated",
  CHURN_RISK_DETECTED = "cs.churn.risk_detected",
  SUCCESS_PLAN_CREATED = "cs.success_plan.created",
  SUCCESS_PLAN_MILESTONE_COMPLETED = "cs.success_plan.milestone_completed",
  INTERVENTION_REQUIRED = "cs.intervention.required",
  ESCALATION_REQUIRED = "cs.escalation.required",
  RENEWAL_RISK_DETECTED = "cs.renewal.risk_detected",
}

/**
 * Concrete implementation of a Customer Success runtime event.
 */
export class CustomerSuccessEvent extends RuntimeEvent {
  constructor(
    public readonly type: CustomerSuccessEventType | string,
    public readonly payload: any = {},
  ) {
    super(type, payload);
  }
}
