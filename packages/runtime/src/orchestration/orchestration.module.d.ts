/**
 * Provides the orchestration services (planning, workflow and their
 * dependencies) shared by the {@link RuntimeModule} and the
 * {@link MissionModule}.
 *
 * Mission orchestration depends on both `PlanningEngine` and `WorkflowEngine`;
 * hosting them here lets every consuming module resolve the same singletons
 * without duplicating instances.
 */
export declare class OrchestrationModule {}
//# sourceMappingURL=orchestration.module.d.ts.map
