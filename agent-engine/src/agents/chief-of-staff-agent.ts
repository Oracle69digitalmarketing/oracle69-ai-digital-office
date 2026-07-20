import { BaseAgent } from '../base-agent.js';
import { TaskContext, AgentMetadata } from '@oracle69/shared';
import { AgentRegistry } from '../agent-registry.js';
import { ModelRouter } from '../model-router.js';
import { PromptLoader } from '../prompt-loader.js';

export class ChiefOfStaffAgent extends BaseAgent {
  constructor(
    metadata: AgentMetadata,
    private executionEngine: any,
    private registry: AgentRegistry,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
  ) {
    super(metadata);
  }

  async execute(task: TaskContext): Promise<any> {
    this.logger.log(`Planning strategic response for task: ${task.taskId}`);
    
    const prompt = await this.promptLoader.getPrompt(this.metadata.role);
    const strategy = await this.modelRouter.execute(
      this.metadata.id,
      `${prompt}\nTask: ${task.objective}\nFormulate a high-level strategy and identify which departments should be involved.`,
      {
        taskId: task.taskId,
        taskDescription: task.objective,
        department: "Strategy",
        complexity: 8,
      }
    );

    // Find Project Manager to handle the breakdown
    const pmAgents = this.registry.findAgentsByRole("Project Manager");
    if (pmAgents.length > 0) {
      const pmTask: TaskContext = {
        ...task,
        taskId: `${task.taskId}-pm`,
        objective: `Execute strategy: ${strategy}`,
        context: { ...task.context, strategy, originalTaskId: task.taskId }
      };
      return await this.executionEngine.executeTask(pmTask, pmAgents[0]);
    }

    return `Strategy formulated, but no Project Manager found to execute: ${strategy}`;
  }
}
