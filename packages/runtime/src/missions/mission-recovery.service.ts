import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MissionManager } from './mission-manager.js';
import { Mission } from './mission.types.js';

/**
 * Recovers missions that were interrupted by a process restart.
 *
 * On application bootstrap the service scans the durable mission repository
 * for missions still in an in-flight state (running, paused, retrying,
 * scheduled) and marks them as recovered so operators can decide whether to
 * resume or abandon them. Because missions are persisted durably, no mission
 * is lost when the runtime restarts.
 */
@Injectable()
export class MissionRecoveryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MissionRecoveryService.name);

  constructor(private readonly missionManager: MissionManager) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const recovered = await this.missionManager.recoverInterrupted();
      this.logger.log(`Mission recovery completed: ${recovered.length} interrupted mission(s) recovered.`);
    } catch (error) {
      this.logger.error('Mission recovery failed during bootstrap.', error);
    }
  }

  /**
   * Manually triggers mission recovery. Returns the recovered missions.
   */
  async recover(tenantId?: string): Promise<Mission[]> {
    return this.missionManager.recoverInterrupted(tenantId);
  }
}
