import { EventBus } from "../events/event-bus.js";
export declare class ExecutiveCoordinator {
  private readonly eventBus;
  private readonly logger;
  constructor(eventBus: EventBus);
  resolveConflict(conflictId: string): Promise<void>;
}
//# sourceMappingURL=executive-coordinator.d.ts.map
