import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExecutiveEventType, ExecutiveEvent } from './executive-events.js';

@Injectable()
export class ExecutiveCoordinator {
  private readonly logger = new Logger(ExecutiveCoordinator.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async resolveConflict(conflictId: string): Promise<void> {
    this.logger.log(`Resolving conflict ${conflictId}`);
    this.emit(ExecutiveEventType.ENTERPRISE_CONFLICT_RESOLVED, { conflictId });
  }

  private emit(type: ExecutiveEventType, payload: any): void {
    this.eventEmitter.emit(type, new ExecutiveEvent(type, payload));
  }
}
