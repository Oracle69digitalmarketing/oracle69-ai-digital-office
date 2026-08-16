import { Injectable, Logger } from "@nestjs/common";
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
@Injectable()
export class MissionEngine {
  private readonly logger = new Logger(MissionEngine.name);

  constructor(
    private readonly missionManager: MissionManager,
    private readonly planningEngine: PlanningEngine,
    private readonly workflowEngine: WorkflowEngine,
    private readonly tenantContext?: TenantContextService,
  ) {}

  /**
   * Initializes a mission, running the initialization work within the mission
   * tenant scope so all downstream events and executions inherit the tenant
   * and mission identifiers.
   */
  async initializeMission(
    missionId: string,
    options: { tenantId?: string; mission?: Mission } = {},
  ): Promise<void> {
    const tenantId =
      options.mission?.tenantId ??
      options.tenantId ??
      this.tenantContext?.getTenantId() ??
      "system";

    const run = async (): Promise<void> => {
      this.logger.log(`Initializing mission ${missionId} for tenant ${tenantId}`);
    };

    if (this.tenantContext) {
      return this.tenantContext.run({ tenantId, missionId }, run);
    }
    return run();
  }
}
