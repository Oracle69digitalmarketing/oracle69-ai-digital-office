import { Injectable } from '@nestjs/common';
import { Mission } from './mission.types.js';

@Injectable()
export class MissionRegistry {
  private missions = new Map<string, Mission>();

  registerMission(mission: Mission): void {
    this.missions.set(mission.id, mission);
  }

  getMission(id: string): Mission | undefined {
    return this.missions.get(id);
  }
}
