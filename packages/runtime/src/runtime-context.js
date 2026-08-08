import { v4 as uuidv4 } from 'uuid';
/**
 * Implementation of the Runtime Context for cross-system correlation and state management.
 */
export class RuntimeContext {
    taskId;
    orgId;
    traceId;
    startTime;
    state = new Map();
    constructor(taskId, orgId, initialMetadata = {}) {
        this.taskId = taskId;
        this.orgId = orgId;
        this.traceId = uuidv4();
        this.startTime = new Date().toISOString();
        // Seed initial metadata
        Object.entries(initialMetadata).forEach(([key, value]) => {
            this.state.set(key, value);
        });
    }
    /**
     * Retrieves a value from the context metadata.
     */
    get(key) {
        return this.state.get(key);
    }
    /**
     * Updates a value in the context metadata.
     */
    set(key, value) {
        this.state.set(key, value);
    }
}
//# sourceMappingURL=runtime-context.js.map