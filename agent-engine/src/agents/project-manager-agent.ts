import { BaseAgent } from "../base-agent.js";
import { TaskContext, AgentMetadata } from "@oracle69/shared";
import { AgentRegistry } from "../agent-registry.js";
import { ModelRouter } from "../model-router.js";
import { PromptLoader } from "../prompt-loader.js";
import { KnowledgeService } from "@oracle69/memory";
import { TenantContextService } from "@oracle69/runtime";

export class ProjectManagerAgent extends BaseAgent {
  constructor(
    metadata: AgentMetadata,
    private executionEngine: any,
    private registry: AgentRegistry,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
    private knowledgeService: KnowledgeService,
    private tenantContext?: TenantContextService,
  ) {
    super(metadata);
  }

  async execute(task: TaskContext): Promise<any> {
    this.logger.log(`Breaking down task for execution: ${task.taskId}`);

    const organizationId = task.organizationId || this.tenantContext?.resolveTenantId();
    if (!organizationId) {
      throw new Error("Tenant context is required for knowledge retrieval");
    }

    // Operational Knowledge Retrieval (past projects, timelines, etc.)
    const knowledge = await this.knowledgeService.getRelevantContext(task.objective, {
      organizationId,
      sessionId: task.sessionId,
      limit: 5,
    });

    const prompt = await this.promptLoader.getPrompt(this.metadata.role);
    const breakdown = await this.modelRouter.execute(
      this.metadata.id,
      `${prompt}\n\n${knowledge}\n\nTask Strategy: ${task.context.strategy}\nIdentify the departments (Marketing, Finance, Operations) needed and what they should do.`,
      {
        taskId: task.taskId,
        taskDescription: task.objective,
        department: "Project Management",
        complexity: 7,
      },
    );

    // Simplistic breakdown parsing - in real life this would be a JSON output
    const departments = ["Marketing", "Finance", "Operations"];
    const results = [];

    for (const dept of departments) {
      if (breakdown.toLowerCase().includes(dept.toLowerCase())) {
        // Department delegation is scoped to the authoritative tenant so an
        // Org-A task can never resolve an Org-B department agent.
        const agents = this.registry.findAgentsByRoleAndTenant(dept, organizationId);
        if (agents.length > 0) {
          const subTask: TaskContext = {
            ...task,
            taskId: `${task.taskId}-${dept.toLowerCase()}`,
            objective: `Execute ${dept} portion of: ${task.objective}`,
            context: { ...task.context, breakdown, parentTaskId: task.taskId },
          };
          const res = await this.executionEngine.executeTask(subTask, agents[0]);
          results.push({ dept, res });
        }
      }
    }

    return `Project Execution Complete. Results: ${results.map((r) => `[${r.dept}]: ${r.res}`).join(" | ")}`;
  }
}
