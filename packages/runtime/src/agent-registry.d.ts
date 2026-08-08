import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAgentRegistry, AgentMetadata } from './runtime.types.js';
export declare class AgentRegistry implements IAgentRegistry {
    private readonly eventEmitter?;
    private readonly logger;
    private readonly agents;
    constructor(eventEmitter?: EventEmitter2 | undefined);
    register(metadata: AgentMetadata): void;
    getAgent(id: string): AgentMetadata | null;
    listAgentsByRole(role: string): AgentMetadata[];
    validate(metadata: AgentMetadata): boolean;
    private emit;
}
//# sourceMappingURL=agent-registry.d.ts.map