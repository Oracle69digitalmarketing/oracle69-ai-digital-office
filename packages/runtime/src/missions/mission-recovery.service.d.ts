import { OnApplicationBootstrap } from "@nestjs/common";
import { MissionManager } from "./mission-manager.js";
import { Mission } from "./mission.types.js";
/**
 * Recovers missions that were interrupted by a process restart.
 *
 * On application bootstrap the service scans the durable mission repository
 * for missions still in an in-flight state (running, paused, retrying,
 * scheduled) and marks them as recovered so operators can decide whether to
 * resume or abandon them. Because missions are persisted durably, no mission
 * is lost when the runtime restarts.
 */
export declare class MissionRecoveryService implements OnApplicationBootstrap {
  private readonly missionManager;
  private readonly logger;
  constructor(missionManager: MissionManager);
  onApplicationBootstrap(): Promise<void>;
  /**
   * Manually triggers mission recovery. Returns the recovered missions.
   */
  recover(tenantId?: string): Promise<Mission[]>;
}
//# sourceMappingURL=mission-recovery.service.d.ts.map
