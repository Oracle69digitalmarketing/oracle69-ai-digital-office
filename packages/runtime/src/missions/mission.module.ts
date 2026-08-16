import { Module } from "@nestjs/common";
import { OrchestrationModule } from "../orchestration/orchestration.module.js";
import { PersistenceModule } from "../persistence/persistence.module.js";
import { MissionEngine } from "./mission-engine.js";
import { MissionManager } from "./mission-manager.js";
import { MissionRegistry } from "./mission-registry.js";
import { MissionScheduler } from "./mission-scheduler.js";
import { MissionCheckpoints } from "./mission-checkpoints.js";
import { MissionRecoveryService } from "./mission-recovery.service.js";

@Module({
  imports: [PersistenceModule, OrchestrationModule],
  providers: [
    MissionEngine,
    MissionManager,
    MissionRegistry,
    MissionScheduler,
    MissionCheckpoints,
    MissionRecoveryService,
  ],
  exports: [
    MissionEngine,
    MissionManager,
    MissionRegistry,
    MissionScheduler,
    MissionCheckpoints,
    MissionRecoveryService,
  ],
})
export class MissionModule {}
