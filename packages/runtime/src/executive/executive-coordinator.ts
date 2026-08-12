import { Injectable, Logger } from '@nestjs/common';
import { ExecutiveEventType, ExecutiveEvent } from './executive-events.js';
import { EventBus } from '../events/event-bus.js';

@Injectable()
export class ExecutiveCoordinator {
  private readonly logger = new Logger(ExecutiveCoordinator.name);

  constructor(private readonly eventBus: EventBus) {}

  async resolveConflict(conflictId: string): Promise<void> {
    this.logger.log(`Resolving conflict ${conflictId}`);
    this.eventBus.publish(new ExecutiveEvent(ExecutiveEventType.ENTERPRISE_CONFLICT_RESOLVED, { conflictId }, { source: 'ExecutiveCoordinator' }));
  }
}
