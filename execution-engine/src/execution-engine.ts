import { Injectable, Logger, Optional } from '@nestjs/common';
import { TaskContext, WorkflowTrace, WorkflowStep, EventBus } from '@oracle69/shared';
import { BaseAgent } from '@oracle69/agent-engine';
import { TenantContext } from '@oracle69/platform-contracts';

export interface WorkflowTraceRepository {
  saveStep(step: WorkflowStep, organizationId?: string): Promise<void>;
  getTrace(workflowId: string): Promise<WorkflowTrace | null>;
}

@Injectable()
export class ExecutionEngine {
  private readonly logger = new Logger(ExecutionEngine.name);
  private traces: Map<string, WorkflowTrace> = new Map();

  constructor(
    private readonly eventBus: EventBus,
    @Optional() private readonly repository?: WorkflowTraceRepository
  ) {}

  async executeTask(
    task: TaskContext,
    agent: BaseAgent,
    retries = 3,
    tenantContext?: TenantContext
  ): Promise<any> {
    const trace = this.getOrCreateTrace(task.sessionId);
    const step: WorkflowStep = {
      stepId: Math.random().toString(36).substring(7),
      taskId: task.taskId,
      agentId: agent.metadata.id,
      status: 'executing',
      startTime: new Date(),
    };
    trace.steps.push(step);
    await this.persistStep(step, tenantContext?.organizationId);

    this.eventBus.publish({
      type: 'task.delegated',
      source: 'execution-engine',
      payload: { taskId: task.taskId, agentId: agent.metadata.id, sessionId: task.sessionId },
    });

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
      await this.persistStep(step, tenantContext?.organizationId);

      this.eventBus.publish({
        type: 'task.completed',
        source: `execution-engine:${agent.metadata.id}`,
        payload: { taskId: task.taskId, result },
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      step.status = 'failed';
      step.endTime = new Date();
      step.error = err.message;

      await agent.onTaskFailed(task, err);
      this.handleTaskFailure(task, err);
      await this.persistStep(step, tenantContext?.organizationId);

      throw err;
    }
  }

  private async persistStep(step: WorkflowStep, organizationId?: string) {
    if (this.repository) {
      try {
        await this.repository.saveStep(step, organizationId);
      } catch (error) {
        this.logger.error(`Failed to persist workflow step ${step.stepId}`, error);
      }
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
