import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Message, MessageStatus } from './message.types.js';
import { AgentDirectory } from './agent-directory.js';
import { AgentMailbox } from './agent-mailbox.js';
import { CommunicationEventType } from './communication-events.js';

@Injectable()
export class MessageRouter {
  private readonly logger = new Logger(MessageRouter.name);

  constructor(
    private readonly directory: AgentDirectory,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async route(message: Message): Promise<void> {
    this.logger.log(`Routing message ${message.id} to ${message.recipient}`);
    
    // Validate
    const recipient = this.directory.lookup(message.recipient);
    if (!recipient) {
      this.logger.error(`Recipient ${message.recipient} not found`);
      return;
    }

    message.status = MessageStatus.DELIVERED;
    this.eventEmitter.emit(CommunicationEventType.MESSAGE_SENT, message);
  }
}
