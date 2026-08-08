import { AgentMetadata } from '../runtime.types.js';
export declare class AgentDirectory {
    private readonly logger;
    private agents;
    register(metadata: AgentMetadata): void;
    unregister(id: string): void;
    lookup(id: string): AgentMetadata | undefined;
    findByDepartment(deptId: string): AgentMetadata[];
    findByCapability(capability: string): AgentMetadata[];
    findAvailable(): AgentMetadata[];
    heartbeat(id: string): void;
}
//# sourceMappingURL=agent-directory.d.ts.map