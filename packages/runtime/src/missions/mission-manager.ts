import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Mission, MissionStatus, IMissionManager } from './mission.types.js';
import { MissionRegistry } from './mission-registry.js';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';

@Injectable()
export class MissionManager implements IMissionManager {
  private readonly logger = new Logger(MissionManager.name);

  constructor(
    private readonly registry: MissionRegistry,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async createMission(mission: Mission): Promise<void> {
    this.registry.registerMission(mission);
    this.emit(RuntimeEventType.MISSION_CREATED, { missionId: mission.id });
  }

  async startMission(missionId: string): Promise<void> {
    const mission = this.registry.getMission(missionId);
    if (!mission) throw new Error('Mission not found');
    mission.status = MissionStatus.RUNNING;
    this.emit(RuntimeEventType.MISSION_STARTED, { missionId });
  }

  private emit(type: RuntimeEventType, payload: any): void {
    this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
  }
}
