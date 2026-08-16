import { Injectable, Logger } from "@nestjs/common";
import { Message } from "./message.types.js";

@Injectable()
export class AgentMailbox {
  private readonly logger = new Logger(AgentMailbox.name);
  private inbox: Message[] = [];
  private outbox: Message[] = [];
  private pending: Message[] = [];
  private completed: Message[] = [];
  private failed: Message[] = [];

  pushToInbox(message: Message): void {
    this.inbox.push(message);
  }

  popFromInbox(): Message | undefined {
    return this.inbox.shift();
  }

  pushToOutbox(message: Message): void {
    this.outbox.push(message);
  }

  // Simplified for MVP
}
