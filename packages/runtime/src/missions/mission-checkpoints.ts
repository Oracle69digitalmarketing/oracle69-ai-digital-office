import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';

@Injectable()
export class MissionCheckpoints {
  private readonly logger = new Logger(MissionCheckpoints.name);
  
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async saveCheckpoint(missionId: string, state: any): Promise<void> {
    this.logger.log(`Checkpoint saved for mission ${missionId}`);
    this.emit(RuntimeEventType.CHECKPOINT_CREATED, { missionId });
  }

  async restoreCheckpoint(missionId: string): Promise<any> {
    this.logger.log(`Checkpoint restored for mission ${missionId}`);
    this.emit(RuntimeEventType.CHECKPOINT_RESTORED, { missionId });
    return {};
  }

  private emit(type: RuntimeEventType, payload: any): void {
    this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
  }
}
