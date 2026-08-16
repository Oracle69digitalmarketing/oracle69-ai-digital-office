import { Module } from "@nestjs/common";
import { AgentRegistry } from "../agent-registry.js";
import { PlanningEngine } from "../planner/planning-engine.js";
import { WorkflowEngine } from "../workflow/workflow-engine.js";
import {
  CheckpointManager,
  RetryManager,
  CompensationManager,
  ApprovalManager,
} from "../workflow/workflow-managers.js";

/**
 * Provides the orchestration services (planning, workflow and their
 * dependencies) shared by the {@link RuntimeModule} and the
 * {@link MissionModule}.
 *
 * Mission orchestration depends on both `PlanningEngine` and `WorkflowEngine`;
 * hosting them here lets every consuming module resolve the same singletons
 * without duplicating instances.
 */
@Module({
  providers: [
    AgentRegistry,
    PlanningEngine,
    WorkflowEngine,
    CheckpointManager,
    RetryManager,
    CompensationManager,
    ApprovalManager,
  ],
  exports: [
    AgentRegistry,
    PlanningEngine,
    WorkflowEngine,
    CheckpointManager,
    RetryManager,
    CompensationManager,
    ApprovalManager,
  ],
})
export class OrchestrationModule {}
