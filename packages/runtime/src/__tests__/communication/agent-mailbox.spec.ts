import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AgentMailbox } from '../../communication/agent-mailbox.js';
import { MessageType, MessagePriority, MessageStatus } from '../../communication/message.types.js';

describe('AgentMailbox', () => {
  let mailbox: AgentMailbox;

  beforeEach(() => {
    mailbox = new AgentMailbox();
  });

  it('should push and pop from inbox', () => {
    const msg = { id: 'm1', correlationId: 'c1', sender: 's1', recipient: 'r1', orgId: 'o1', departmentId: 'd1', type: MessageType.NOTIFICATION, priority: MessagePriority.NORMAL, timestamp: 'now', payload: {}, metadata: {}, status: MessageStatus.CREATED } as any;
    mailbox.pushToInbox(msg);
    expect(mailbox.popFromInbox()).toEqual(msg);
  });
});
