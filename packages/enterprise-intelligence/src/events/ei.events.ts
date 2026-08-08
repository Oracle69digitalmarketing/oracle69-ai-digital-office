import { RuntimeEvent } from '@oracle69/runtime';

/**
 * Enumeration of all Enterprise Intelligence event types.
 */
export enum EnterpriseIntelligenceEventType {
  KPI_UPDATED = 'ei.kpi.updated',
  BUSINESS_HEALTH_UPDATED = 'ei.business_health.updated',
  BUSINESS_HEALTH_DETERIORATED = 'ei.business_health.deteriorated',
  FORECAST_UPDATED = 'ei.forecast.updated',
  SCENARIO_CREATED = 'ei.scenario.created',
  INSIGHT_GENERATED = 'ei.insight.generated',
  RECOMMENDATION_GENERATED = 'ei.recommendation.generated',
  REPORT_GENERATED = 'ei.report.generated',
  EXECUTIVE_ALERT_REQUIRED = 'ei.executive_alert.required',
}

/**
 * Concrete implementation of an Enterprise Intelligence runtime event.
 */
export class EnterpriseIntelligenceEvent extends RuntimeEvent {
  constructor(
    public readonly type: EnterpriseIntelligenceEventType | string,
    public readonly payload: any = {}
  ) {
    super(type, payload);
  }
}
