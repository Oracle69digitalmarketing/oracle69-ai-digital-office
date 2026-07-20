import { Injectable, Logger } from '@nestjs/common';
import { TaskContext, WorkflowTrace, WorkflowStep } from '@oracle69/shared';
import { BaseAgent } from '@oracle69/agent-engine';

@Injectable()
export class ExecutionEngine {
  private readonly logger = new Logger(ExecutionEngine.name);
  private traces: Map<string, WorkflowTrace> = new Map();

  async executeTask(task: TaskContext, agent: BaseAgent, retries = 3): Promise<any> {
    const trace = this.getOrCreateTrace(task.sessionId);
    const step: WorkflowStep = {
      stepId: Math.random().toString(36).substring(7),
      taskId: task.taskId,
      agentId: agent.metadata.id,
      status: 'executing',
      startTime: new Date(),
    };
    trace.steps.push(step);

    try {
      await agent.onTaskReceived(task);
      
      const result = await this.executeWithRetry(
        () => agent.execute(task),
        retries,
        task.taskId
      );

      step.status = 'completed';
      step.endTime = new Date();
      step.result = result;

      await agent.onTaskCompleted(task, result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      step.status = 'failed';
      step.endTime = new Date();
      step.error = err.message;

      await agent.onTaskFailed(task, err);
      this.handleTaskFailure(task, err);
      throw err;
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, retries: number, taskId: string): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        // Implement timeout handling here if needed
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = Math.pow(2, i) * 1000;
        this.logger.warn(`Task ${taskId} failed (attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  private handleTaskFailure(task: TaskContext, error: any) {
    this.logger.error(`Critical failure in task ${task.taskId}. Moving to dead-letter queue.`, error.stack);
    // Placeholder for dead-letter queue implementation
  }

  private getOrCreateTrace(workflowId: string): WorkflowTrace {
    if (!this.traces.has(workflowId)) {
      this.traces.set(workflowId, {
        workflowId,
        steps: [],
        startTime: new Date(),
        status: 'executing',
      });
    }
    return this.traces.get(workflowId)!;
  }

  getTrace(workflowId: string): WorkflowTrace | undefined {
    return this.traces.get(workflowId);
  }
}
