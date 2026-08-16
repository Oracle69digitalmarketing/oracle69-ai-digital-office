import { Message } from "./message.types.js";
import { AgentDirectory } from "./agent-directory.js";
import { EventBus } from "../events/event-bus.js";
export declare class MessageRouter {
  private readonly directory;
  private readonly eventBus;
  private readonly logger;
  constructor(directory: AgentDirectory, eventBus: EventBus);
  route(message: Message): Promise<void>;
}
//# sourceMappingURL=message-router.d.ts.map
