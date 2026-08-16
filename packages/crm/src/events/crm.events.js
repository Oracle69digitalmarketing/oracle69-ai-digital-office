import { RuntimeEvent } from "@oracle69/runtime";
/**
 * Enumeration of all CRM-related event types.
 */
export var CrmEventType;
(function (CrmEventType) {
    // Contact Events
    CrmEventType["CONTACT_CREATED"] = "crm.contact.created";
    CrmEventType["CONTACT_UPDATED"] = "crm.contact.updated";
    CrmEventType["CONTACT_DELETED"] = "crm.contact.deleted";
    // Organization Events
    CrmEventType["ORGANIZATION_CREATED"] = "crm.organization.created";
    CrmEventType["ORGANIZATION_UPDATED"] = "crm.organization.updated";
    CrmEventType["ORGANIZATION_DELETED"] = "crm.organization.deleted";
    // Lead Events
    CrmEventType["LEAD_CREATED"] = "crm.lead.created";
    CrmEventType["LEAD_UPDATED"] = "crm.lead.updated";
    CrmEventType["LEAD_DELETED"] = "crm.lead.deleted";
    CrmEventType["LEAD_QUALIFIED"] = "crm.lead.qualified";
    CrmEventType["LEAD_DISQUALIFIED"] = "crm.lead.disqualified";
    CrmEventType["LEAD_CONVERTED"] = "crm.lead.converted";
    // Opportunity Events
    CrmEventType["OPPORTUNITY_CREATED"] = "crm.opportunity.created";
    CrmEventType["OPPORTUNITY_UPDATED"] = "crm.opportunity.updated";
    CrmEventType["OPPORTUNITY_DELETED"] = "crm.opportunity.deleted";
    CrmEventType["OPPORTUNITY_WON"] = "crm.opportunity.won";
    CrmEventType["OPPORTUNITY_LOST"] = "crm.opportunity.lost";
    CrmEventType["OPPORTUNITY_STAGE_CHANGED"] = "crm.opportunity.stage_changed";
    // Activity Events
    CrmEventType["ACTIVITY_CREATED"] = "crm.activity.created";
    CrmEventType["ACTIVITY_COMPLETED"] = "crm.activity.completed";
    CrmEventType["ACTIVITY_CANCELLED"] = "crm.activity.cancelled";
    // AI Events
    CrmEventType["LEAD_SCORED"] = "crm.ai.lead_scored";
    CrmEventType["OPPORTUNITY_PREDICTED"] = "crm.ai.opportunity_predicted";
    CrmEventType["ACTIVITY_SUMMARIZED"] = "crm.ai.activity_summarized";
    CrmEventType["NEXT_ACTION_RECOMMENDED"] = "crm.ai.next_action_recommended";
})(CrmEventType || (CrmEventType = {}));
/**
 * Concrete implementation of a CRM runtime event.
 */
export class CrmEvent extends RuntimeEvent {
    type;
    payload;
    constructor(type, payload = {}) {
        super(type, payload);
        this.type = type;
        this.payload = payload;
    }
}
