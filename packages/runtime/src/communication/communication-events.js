import { RuntimeEvent } from '../events/runtime.events.js';
export var CommunicationEventType;
(function (CommunicationEventType) {
    CommunicationEventType["COMMUNICATION_STARTED"] = "communication.started";
    CommunicationEventType["COMMUNICATION_COMPLETED"] = "communication.completed";
    CommunicationEventType["COMMUNICATION_FAILED"] = "communication.failed";
    CommunicationEventType["MESSAGE_SENT"] = "message.sent";
    CommunicationEventType["MESSAGE_RECEIVED"] = "message.received";
    CommunicationEventType["MESSAGE_ACKNOWLEDGED"] = "message.acknowledged";
    CommunicationEventType["MESSAGE_TIMEOUT"] = "message.timeout";
    CommunicationEventType["MESSAGE_RETRY"] = "message.retry";
    CommunicationEventType["AGENT_REGISTERED"] = "agent.registered";
    CommunicationEventType["AGENT_UNREGISTERED"] = "agent.unregistered";
    CommunicationEventType["HEARTBEAT_RECEIVED"] = "heartbeat.received";
    CommunicationEventType["DELEGATION_CREATED"] = "delegation.created";
    CommunicationEventType["DELEGATION_ACCEPTED"] = "delegation.accepted";
    CommunicationEventType["DELEGATION_REJECTED"] = "delegation.rejected";
    CommunicationEventType["DELEGATION_COMPLETED"] = "delegation.completed";
})(CommunicationEventType || (CommunicationEventType = {}));
export class CommunicationEvent extends RuntimeEvent {
}
