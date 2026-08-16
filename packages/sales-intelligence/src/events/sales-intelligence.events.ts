import { RuntimeEvent } from "@oracle69/runtime";

export enum SalesIntelligenceEventType {
  LEAD_SCORED = "sales.intelligence.lead_scored",
  OPPORTUNITY_SCORED = "sales.intelligence.opportunity_scored",
  DEAL_RISK_DETECTED = "sales.intelligence.deal_risk_detected",
  FORECAST_UPDATED = "sales.intelligence.forecast_updated",
  SALES_SIGNAL_DETECTED = "sales.intelligence.sales_signal_detected",
  NEXT_BEST_ACTION_GENERATED = "sales.intelligence.next_best_action_generated",
  ACCOUNT_HEALTH_CHANGED = "sales.intelligence.account_health_changed",
  PIPELINE_ANOMALY_DETECTED = "sales.intelligence.pipeline_anomaly_detected",
  EXECUTIVE_SALES_ALERT_CREATED = "sales.intelligence.executive_sales_alert_created",
}

export class SalesIntelligenceEvent extends RuntimeEvent {
  constructor(
    public readonly type: SalesIntelligenceEventType | string,
    public readonly payload: any = {},
  ) {
    super(type, payload);
  }
}
