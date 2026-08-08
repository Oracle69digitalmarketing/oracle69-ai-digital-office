import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ExecutiveCoordinator {
    private readonly eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    resolveConflict(conflictId: string): Promise<void>;
    private emit;
}
//# sourceMappingURL=executive-coordinator.d.ts.map