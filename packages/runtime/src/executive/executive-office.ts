import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IExecutiveOffice, EnterpriseGoal } from './executive.types.js';
import { ExecutiveEventType, ExecutiveEvent } from './executive-events.js';

@Injectable()
export class ExecutiveOffice implements IExecutiveOffice {
  private readonly logger = new Logger(ExecutiveOffice.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async assignEnterpriseGoal(goal: EnterpriseGoal): Promise<void> {
    this.logger.log(`Assigning enterprise goal: ${goal.goal}`);
    this.emit(ExecutiveEventType.EXECUTIVE_GOAL_CREATED, { goalId: goal.id });
  }

  async approveMission(missionId: string): Promise<void> {
    this.logger.log(`Approving mission: ${missionId}`);
    this.emit(ExecutiveEventType.EXECUTIVE_GOAL_APPROVED, { missionId });
  }

  private emit(type: ExecutiveEventType, payload: any): void {
    this.eventEmitter.emit(type, new ExecutiveEvent(type, payload));
  }
}
