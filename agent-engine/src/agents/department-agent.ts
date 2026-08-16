import { BaseAgent } from "../base-agent.js";
import { TaskContext, AgentMetadata } from "@oracle69/shared";
import { ModelRouter } from "../model-router.js";
import { PromptLoader } from "../prompt-loader.js";
import { KnowledgeService } from "@oracle69/memory";

export class DepartmentAgent extends BaseAgent {
  constructor(
    metadata: AgentMetadata,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
    private knowledgeService: KnowledgeService,
  ) {
    super(metadata);
  }

  async execute(task: TaskContext): Promise<any> {
    this.logger.log(`Executing department task: ${task.taskId}`);

    // Retrieve organizational knowledge
    const knowledge = await this.knowledgeService.getRelevantContext(task.objective, {
      organizationId: "system", // Should be dynamic
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
