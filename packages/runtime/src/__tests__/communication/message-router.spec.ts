import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MessageRouter } from '../../communication/message-router.js';
import { AgentDirectory } from '../../communication/agent-directory.js';
import { MessageType, MessagePriority, MessageStatus } from '../../communication/message.types.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('MessageRouter', () => {
  let router: MessageRouter;
  let directory: AgentDirectory;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    directory = new AgentDirectory();
    router = new MessageRouter(directory, eventEmitter);
  });

  it('should route message successfully', async () => {
    directory.register({ id: 'r1', name: 'R1', role: 'tester', version: '1.0.0' });
    const msg = { id: 'm1', recipient: 'r1', status: MessageStatus.CREATED } as any;
    
    await router.route(msg);
    expect(msg.status).toBe(MessageStatus.DELIVERED);
  });
});
