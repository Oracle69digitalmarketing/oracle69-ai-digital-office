import { Injectable, Logger } from '@nestjs/common';
import { IExecutiveOffice, EnterpriseGoal } from './executive.types.js';
import { ExecutiveEventType, ExecutiveEvent } from './executive-events.js';
import { EventBus } from '../events/event-bus.js';

@Injectable()
export class ExecutiveOffice implements IExecutiveOffice {
  private readonly logger = new Logger(ExecutiveOffice.name);

  constructor(private readonly eventBus: EventBus) {}

  async assignEnterpriseGoal(goal: EnterpriseGoal): Promise<void> {
    this.logger.log(`Assigning enterprise goal: ${goal.goal}`);
    this.eventBus.publish(new ExecutiveEvent(ExecutiveEventType.EXECUTIVE_GOAL_CREATED, { goalId: goal.id }, { source: 'ExecutiveOffice' }));
  }

  async approveMission(missionId: string): Promise<void> {
    this.logger.log(`Approving mission: ${missionId}`);
    this.eventBus.publish(new ExecutiveEvent(ExecutiveEventType.EXECUTIVE_GOAL_APPROVED, { missionId }, { source: 'ExecutiveOffice' }));
  }
}
