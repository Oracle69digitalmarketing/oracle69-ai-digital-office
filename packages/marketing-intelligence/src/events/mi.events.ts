import { RuntimeEvent } from '@oracle69/runtime';

/**
 * Enumeration of all Marketing Intelligence event types.
 */
export enum MarketingIntelligenceEventType {
  CAMPAIGN_CREATED = 'mi.campaign.created',
  CAMPAIGN_METRICS_UPDATED = 'mi.campaign.metrics.updated',
  SEO_UPDATED = 'mi.seo.updated',
  CONVERSION_UPDATED = 'mi.conversion.updated',
  LEAD_SCORED = 'mi.lead.scored',
  OPPORTUNITY_DETECTED = 'mi.opportunity.detected',
  INSIGHT_GENERATED = 'mi.insight.generated',
  PRICING_SUGGESTION_GENERATED = 'mi.pricing_suggestion.generated',
  REPORT_GENERATED = 'mi.report.generated',
  GROWTH_ALERT_REQUIRED = 'mi.growth_alert.required',
}

/**
 * Concrete implementation of a Marketing Intelligence runtime event.
 */
export class MarketingIntelligenceEvent extends RuntimeEvent {
  constructor(
    public readonly type: MarketingIntelligenceEventType | string,
    public readonly payload: any = {}
  ) {
    super(type, payload);
  }
}
