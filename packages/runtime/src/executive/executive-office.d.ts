import { IExecutiveOffice, EnterpriseGoal } from "./executive.types.js";
import { EventBus } from "../events/event-bus.js";
export declare class ExecutiveOffice implements IExecutiveOffice {
  private readonly eventBus;
  private readonly logger;
  constructor(eventBus: EventBus);
  assignEnterpriseGoal(goal: EnterpriseGoal): Promise<void>;
  approveMission(missionId: string): Promise<void>;
}
//# sourceMappingURL=executive-office.d.ts.map
