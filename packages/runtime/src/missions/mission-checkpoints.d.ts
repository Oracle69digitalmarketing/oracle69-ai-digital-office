import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MissionCheckpoints {
    private readonly eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    saveCheckpoint(missionId: string, state: any): Promise<void>;
    restoreCheckpoint(missionId: string): Promise<any>;
    private emit;
}
//# sourceMappingURL=mission-checkpoints.d.ts.map