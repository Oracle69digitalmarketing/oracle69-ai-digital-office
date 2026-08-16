import { Message } from "./message.types.js";
export declare class AgentMailbox {
  private readonly logger;
  private inbox;
  private outbox;
  private pending;
  private completed;
  private failed;
  pushToInbox(message: Message): void;
  popFromInbox(): Message | undefined;
  pushToOutbox(message: Message): void;
}
//# sourceMappingURL=agent-mailbox.d.ts.map
