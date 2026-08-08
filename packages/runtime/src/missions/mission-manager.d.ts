import { EventEmitter2 } from '@nestjs/event-emitter';
import { Mission, IMissionManager } from './mission.types.js';
import { MissionRegistry } from './mission-registry.js';
export declare class MissionManager implements IMissionManager {
    private readonly registry;
    private readonly eventEmitter;
    private readonly logger;
    constructor(registry: MissionRegistry, eventEmitter: EventEmitter2);
    createMission(mission: Mission): Promise<void>;
    startMission(missionId: string): Promise<void>;
    private emit;
}
//# sourceMappingURL=mission-manager.d.ts.map