import { Injectable, Logger } from '@nestjs/common';
import { TaskContext } from '@oracle69/shared';

@Injectable()
export class ExecutionEngine {
  private readonly logger = new Logger(ExecutionEngine.name);

  async executeTask(task: TaskContext, agent: any): Promise<any> {
    this.logger.log(`Executing task ${task.taskId} with agent ${agent.metadata.name}`);
    return await agent.execute(task);
  }
}
