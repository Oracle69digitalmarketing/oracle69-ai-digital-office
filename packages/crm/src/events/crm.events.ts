import { RuntimeEvent } from "@oracle69/runtime";

/**
 * Enumeration of all CRM-related event types.
 */
export enum CrmEventType {
  // Contact Events
  CONTACT_CREATED = "crm.contact.created",
  CONTACT_UPDATED = "crm.contact.updated",
  CONTACT_DELETED = "crm.contact.deleted",

  // Organization Events
  ORGANIZATION_CREATED = "crm.organization.created",
  ORGANIZATION_UPDATED = "crm.organization.updated",
  ORGANIZATION_DELETED = "crm.organization.deleted",

  // Lead Events
  LEAD_CREATED = "crm.lead.created",
  LEAD_UPDATED = "crm.lead.updated",
  LEAD_DELETED = "crm.lead.deleted",
  LEAD_QUALIFIED = "crm.lead.qualified",
  LEAD_DISQUALIFIED = "crm.lead.disqualified",
  LEAD_CONVERTED = "crm.lead.converted",

  // Opportunity Events
  OPPORTUNITY_CREATED = "crm.opportunity.created",
  OPPORTUNITY_UPDATED = "crm.opportunity.updated",
  OPPORTUNITY_DELETED = "crm.opportunity.deleted",
  OPPORTUNITY_WON = "crm.opportunity.won",
  OPPORTUNITY_LOST = "crm.opportunity.lost",
  OPPORTUNITY_STAGE_CHANGED = "crm.opportunity.stage_changed",

  // Activity Events
  ACTIVITY_CREATED = "crm.activity.created",
  ACTIVITY_COMPLETED = "crm.activity.completed",
  ACTIVITY_CANCELLED = "crm.activity.cancelled",

  // AI Events
  LEAD_SCORED = "crm.ai.lead_scored",
  OPPORTUNITY_PREDICTED = "crm.ai.opportunity_predicted",
  ACTIVITY_SUMMARIZED = "crm.ai.activity_summarized",
  NEXT_ACTION_RECOMMENDED = "crm.ai.next_action_recommended",
}

/**
 * Concrete implementation of a CRM runtime event.
 */
export class CrmEvent extends RuntimeEvent {
  constructor(
    public override readonly type: CrmEventType | string,
    public override readonly payload: any = {},
  ) {
    super(type, payload);
  }
}
