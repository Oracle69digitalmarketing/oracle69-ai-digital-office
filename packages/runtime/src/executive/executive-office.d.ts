import { EventEmitter2 } from '@nestjs/event-emitter';
import { IExecutiveOffice, EnterpriseGoal } from './executive.types.js';
export declare class ExecutiveOffice implements IExecutiveOffice {
    private readonly eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    assignEnterpriseGoal(goal: EnterpriseGoal): Promise<void>;
    approveMission(missionId: string): Promise<void>;
    private emit;
}
//# sourceMappingURL=executive-office.d.ts.map