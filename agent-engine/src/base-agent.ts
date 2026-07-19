import { AgentMetadata, TaskContext } from '@oracle69/shared';

export abstract class BaseAgent {
  constructor(public readonly metadata: AgentMetadata) {}

  abstract execute(task: TaskContext): Promise<any>;
  
  protected logExecution(taskId: string, message: string) {
    console.log(`[Agent: ${this.metadata.name}][Task: ${taskId}] ${message}`);
  }
}
