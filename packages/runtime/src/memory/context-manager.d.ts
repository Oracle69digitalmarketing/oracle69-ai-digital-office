import { EventEmitter2 } from '@nestjs/event-emitter';
import { IContextManager } from './memory.types.js';
export declare class ContextManager implements IContextManager {
    private readonly eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    hydrate(agentId: string, workflowId: string): Promise<Record<string, any>>;
    compress(context: Record<string, any>): Record<string, any>;
    private emit;
}
//# sourceMappingURL=context-manager.d.ts.map