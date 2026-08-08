import { EventEmitter2 } from '@nestjs/event-emitter';
import { MissionManager } from './mission-manager.js';
import { PlanningEngine } from '../planner/planning-engine.js';
import { WorkflowEngine } from '../workflow/workflow-engine.js';
export declare class MissionEngine {
    private readonly missionManager;
    private readonly planningEngine;
    private readonly workflowEngine;
    private readonly eventEmitter;
    private readonly logger;
    constructor(missionManager: MissionManager, planningEngine: PlanningEngine, workflowEngine: WorkflowEngine, eventEmitter: EventEmitter2);
    initializeMission(missionId: string): Promise<void>;
}
//# sourceMappingURL=mission-engine.d.ts.map