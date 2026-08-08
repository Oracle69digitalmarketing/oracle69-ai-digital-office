import { IRuntimeContext } from './runtime.types.js';
/**
 * Implementation of the Runtime Context for cross-system correlation and state management.
 */
export declare class RuntimeContext implements IRuntimeContext {
    readonly taskId: string;
    readonly orgId: string;
    readonly traceId: string;
    readonly startTime: string;
    private readonly state;
    constructor(taskId: string, orgId: string, initialMetadata?: Record<string, any>);
    /**
     * Retrieves a value from the context metadata.
     */
    get(key: string): any;
    /**
     * Updates a value in the context metadata.
     */
    set(key: string, value: any): void;
}
//# sourceMappingURL=runtime-context.d.ts.map