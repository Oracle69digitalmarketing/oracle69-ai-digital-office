import { AgentMetadata, TaskContext, AgentStatus } from '@oracle69/shared';
import { Logger } from '@nestjs/common';

export abstract class BaseAgent {
  protected readonly logger: Logger;

  constructor(public metadata: AgentMetadata) {
    this.logger = new Logger(`${this.metadata.name}Agent`);
  }

  async onInitialize(): Promise<void> {
    this.logger.log(`Initializing agent: ${this.metadata.name}`);
    this.metadata.healthStatus = 'idle';
  }

  async onActivate(): Promise<void> {
    this.logger.log(`Activating agent: ${this.metadata.name}`);
  }

  async onTaskReceived(task: TaskContext): Promise<void> {
    this.logger.log(`Task received: ${task.taskId}`);
    this.metadata.healthStatus = 'busy';
  }

  async onTaskCompleted(task: TaskContext, result: any): Promise<void> {
    this.logger.log(`Task completed: ${task.taskId}`);
    this.metadata.healthStatus = 'idle';
  }

  async onTaskFailed(task: TaskContext, error: Error): Promise<void> {
    this.logger.error(`Task failed: ${task.taskId}`, error.stack);
    this.metadata.healthStatus = 'error';
  }

  async onShutdown(): Promise<void> {
    this.logger.log(`Shutting down agent: ${this.metadata.name}`);
    this.metadata.healthStatus = 'offline';
  }

  abstract execute(task: TaskContext): Promise<any>;

  updateStatus(status: AgentStatus) {
    this.metadata.healthStatus = status;
  }
}
