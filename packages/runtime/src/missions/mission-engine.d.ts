import { MissionManager } from "./mission-manager.js";
import { Mission } from "./mission.types.js";
import { PlanningEngine } from "../planner/planning-engine.js";
import { WorkflowEngine } from "../workflow/workflow-engine.js";
import { TenantContextService } from "../tenancy/tenant-context.js";
/**
 * Orchestrates mission execution across planning, workflow and the durable
 * mission store, propagating tenant context so every downstream step is
 * tenant-scoped.
 */
export declare class MissionEngine {
  private readonly missionManager;
  private readonly planningEngine;
  private readonly workflowEngine;
  private readonly tenantContext?;
  private readonly logger;
  constructor(
    missionManager: MissionManager,
    planningEngine: PlanningEngine,
    workflowEngine: WorkflowEngine,
    tenantContext?: TenantContextService | undefined,
  );
  /**
   * Initializes a mission, running the initialization work within the mission
   * tenant scope so all downstream events and executions inherit the tenant
   * and mission identifiers.
   */
  initializeMission(
    missionId: string,
    options?: {
      tenantId?: string;
      mission?: Mission;
    },
  ): Promise<void>;
}
//# sourceMappingURL=mission-engine.d.ts.map
