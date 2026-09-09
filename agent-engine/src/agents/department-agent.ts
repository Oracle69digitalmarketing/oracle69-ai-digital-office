import { BaseAgent } from "../base-agent.js";
import { TaskContext, AgentMetadata } from "@oracle69/shared";
import { ModelRouter } from "../model-router.js";
import { PromptLoader } from "../prompt-loader.js";
import { KnowledgeService } from "@oracle69/memory";
import { TenantContextService } from "@oracle69/runtime";

export class DepartmentAgent extends BaseAgent {
  constructor(
    metadata: AgentMetadata,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
    private knowledgeService: KnowledgeService,
    private tenantContext?: TenantContextService,
  ) {
    super(metadata);
  }

  async execute(task: TaskContext): Promise<any> {
    this.logger.log(`Executing department task: ${task.taskId}`);

    const organizationId = task.organizationId || this.tenantContext?.resolveTenantId();
    if (!organizationId) {
      throw new Error("Tenant context is required for knowledge retrieval");
    }

    // Retrieve organizational knowledge
    const knowledge = await this.knowledgeService.getRelevantContext(task.objective, {
      organizationId,
      sessionId: task.sessionId,
    });

    const prompt = await this.promptLoader.getPrompt(this.metadata.role);
    const finalPrompt = `${prompt}\n\n${knowledge}\n\nTask: ${task.objective}\nContext: ${JSON.stringify(task.context)}`;

    return await this.modelRouter.execute(this.metadata.id, finalPrompt, {
      taskId: task.taskId,
      taskDescription: task.objective,
      department: this.metadata.role,
      complexity: 5,
    });
  }
}
