import { ExecutionEngine } from '../execution-engine';
import { BaseAgent } from '@oracle69/agent-engine';
import { TaskContext } from '@oracle69/shared';

describe('ExecutionEngine', () => {
  let engine: ExecutionEngine;
  let mockAgent: any;
  const task: TaskContext = {
    taskId: 'task-1',
    projectId: 'proj-1',
    sessionId: 'sess-1',
    priority: 'medium',
    objective: 'Test task',
    context: {},
  };

  beforeEach(() => {
    engine = new ExecutionEngine();
    mockAgent = {
      metadata: { id: 'agent-1', name: 'Agent 1' },
      onTaskReceived: jest.fn(),
      onTaskCompleted: jest.fn(),
      onTaskFailed: jest.fn(),
      execute: jest.fn(),
    };
  });

  it('should execute a task successfully', async () => {
    mockAgent.execute.mockResolvedValue('success');

    const result = await engine.executeTask(task, mockAgent);

    expect(result).toBe('success');
    expect(mockAgent.onTaskReceived).toHaveBeenCalledWith(task);
    expect(mockAgent.onTaskCompleted).toHaveBeenCalledWith(task, 'success');
  });

  it('should retry on failure and eventually succeed', async () => {
    mockAgent.execute
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await engine.executeTask(task, mockAgent, 2);

    expect(result).toBe('success');
    expect(mockAgent.execute).toHaveBeenCalledTimes(2);
  });

  it('should fail after all retries', async () => {
    mockAgent.execute.mockRejectedValue(new Error('permanent fail'));

    await expect(engine.executeTask(task, mockAgent, 2)).rejects.toThrow('permanent fail');
    expect(mockAgent.execute).toHaveBeenCalledTimes(2);
    expect(mockAgent.onTaskFailed).toHaveBeenCalled();
  });
});
