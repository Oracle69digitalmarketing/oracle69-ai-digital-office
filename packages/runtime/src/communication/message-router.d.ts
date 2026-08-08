import { EventEmitter2 } from '@nestjs/event-emitter';
import { Message } from './message.types.js';
import { AgentDirectory } from './agent-directory.js';
export declare class MessageRouter {
    private readonly directory;
    private readonly eventEmitter;
    private readonly logger;
    constructor(directory: AgentDirectory, eventEmitter: EventEmitter2);
    route(message: Message): Promise<void>;
}
//# sourceMappingURL=message-router.d.ts.map