import type { IAgentRegistry, IRuntimeContext } from "../runtime.types.js";
import { IPlanningEngine, ExecutionPlan } from "./planner.types.js";
import { EventBus } from "../events/event-bus.js";
export declare class PlanningEngine implements IPlanningEngine {
  private readonly registry;
  private readonly eventBus;
  private readonly logger;
  private activeContext?;
  constructor(registry: IAgentRegistry, eventBus: EventBus);
  /**
   * Generates a deterministic execution plan for a business goal.
   */
  generatePlan(goal: string, context: IRuntimeContext): Promise<ExecutionPlan>;
  /**
   * Validates the execution plan for structural integrity and feasibility.
   */
  validatePlan(plan: ExecutionPlan): Promise<{
    valid: boolean;
    errors?: string[];
  }>;
  /**
   * Strategic logic to break a goal into a sequence of tasks.
   * For Sprint 6.2, we use deterministic logic for specific patterns.
   */
  private decomposeGoal;
  /**
   * Matches a task to the best available agent in the registry.
   */
  private selectAgent;
  /**
   * Ensures every task dependency exists in the list.
   */
  private resolveDependencies;
  /**
   * Circular dependency detection using Depth First Search.
   */
  private hasCircularDependencies;
  private emit;
}
//# sourceMappingURL=planning-engine.d.ts.map
