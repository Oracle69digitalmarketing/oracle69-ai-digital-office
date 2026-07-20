import { BaseAgent } from '../base-agent.js';
import { TaskContext, AgentMetadata } from '@oracle69/shared';
import { ModelRouter } from '../model-router.js';
import { PromptLoader } from '../prompt-loader.js';

export class DepartmentAgent extends BaseAgent {
  constructor(
    metadata: AgentMetadata,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
  ) {
    super(metadata);
  }

  async execute(task: TaskContext): Promise<any> {
    this.logger.log(`Executing department task: ${task.taskId}`);
    
    const prompt = await this.promptLoader.getPrompt(this.metadata.role);
    return await this.modelRouter.execute(
      this.metadata.id,
      `${prompt}\nTask: ${task.objective}\nContext: ${JSON.stringify(task.context)}`,
      {
        taskId: task.taskId,
        taskDescription: task.objective,
        department: this.metadata.role,
        complexity: 5,
      }
    );
  }
}
