import { RuntimeEvent } from "@oracle69/runtime";

/**
 * Enumeration of all Operations Intelligence event types.
 */
export enum OperationsIntelligenceEventType {
  OPERATIONS_UPDATED = "oi.operations.updated",
  WORKFLOW_UPDATED = "oi.workflow.updated",
  AGENT_UTILIZATION_UPDATED = "oi.agent.utilization.updated",
  INSIGHT_GENERATED = "oi.insight.generated",
  RECOMMENDATION_GENERATED = "oi.recommendation.generated",
  REPORT_GENERATED = "oi.report.generated",
  OPS_ALERT_REQUIRED = "oi.ops_alert.required",
}

/**
 * Concrete implementation of an Operations Intelligence runtime event.
 */
export class OperationsIntelligenceEvent extends RuntimeEvent {
  constructor(
    public readonly type: OperationsIntelligenceEventType | string,
    public readonly payload: any = {},
  ) {
    super(type, payload);
  }
}
