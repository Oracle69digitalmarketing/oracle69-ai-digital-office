import { RuntimeEvent } from '../events/runtime.events.js';

export enum CommunicationEventType {
  COMMUNICATION_STARTED = 'communication.started',
  COMMUNICATION_COMPLETED = 'communication.completed',
  COMMUNICATION_FAILED = 'communication.failed',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_ACKNOWLEDGED = 'message.acknowledged',
  MESSAGE_TIMEOUT = 'message.timeout',
  MESSAGE_RETRY = 'message.retry',
  AGENT_REGISTERED = 'agent.registered',
  AGENT_UNREGISTERED = 'agent.unregistered',
  HEARTBEAT_RECEIVED = 'heartbeat.received',
  DELEGATION_CREATED = 'delegation.created',
  DELEGATION_ACCEPTED = 'delegation.accepted',
  DELEGATION_REJECTED = 'delegation.rejected',
  DELEGATION_COMPLETED = 'delegation.completed',
}

export class CommunicationEvent extends RuntimeEvent {}
