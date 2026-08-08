import { IToolRegistry } from './tool.types.js';
export declare class ToolRegistry implements IToolRegistry {
    private readonly logger;
    private connectors;
    constructor();
    resolveConnector(connectorId: string): any;
    validateToolAccess(agentId: string, toolId: string): boolean;
}
//# sourceMappingURL=tool-registry.d.ts.map