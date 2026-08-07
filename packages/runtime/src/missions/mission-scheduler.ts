import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MissionScheduler {
  private readonly logger = new Logger(MissionScheduler.name);

  scheduleMission(missionId: string, cron: string): void {
    this.logger.log(`Mission ${missionId} scheduled with cron: ${cron}`);
  }

  cancelSchedule(missionId: string): void {
    this.logger.log(`Schedule cancelled for mission ${missionId}`);
  }
}
