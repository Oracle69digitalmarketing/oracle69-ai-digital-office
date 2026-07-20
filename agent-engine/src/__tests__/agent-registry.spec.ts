import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AgentRegistry } from '../agent-registry';
import { BaseAgent } from '../base-agent';
import { AgentMetadata, TaskContext } from '@oracle69/shared';

class TestAgent extends BaseAgent {
  async execute(task: TaskContext): Promise<any> {
    return `Executed ${task.taskId}`;
  }
}

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let testAgent: TestAgent;
  const metadata: AgentMetadata = {
    id: 'test-agent',
    name: 'Test Agent',
    role: 'Tester',
    description: 'A test agent',
    version: '1.0.0',
    capabilities: ['testing'],
    permissions: [],
    supportedModels: ['nano'],
    healthStatus: 'offline',
  };

  beforeEach(() => {
    registry = new AgentRegistry();
    testAgent = new TestAgent(metadata);
  });

  it('should register an agent and trigger lifecycle hooks', async () => {
    const initSpy = jest.spyOn(testAgent, 'onInitialize');
    const activateSpy = jest.spyOn(testAgent, 'onActivate');

    await registry.register(testAgent);

    expect(registry.getAgent('test-agent')).toBe(testAgent);
    expect(initSpy).toHaveBeenCalled();
    expect(activateSpy).toHaveBeenCalled();
    expect(testAgent.metadata.healthStatus).toBe('idle');
  });

  it('should find agents by capability', async () => {
    await registry.register(testAgent);
    const agents = registry.findAgentsByCapability('testing');
    expect(agents).toContain(testAgent);
  });

  it('should deregister an agent and trigger shutdown', async () => {
    await registry.register(testAgent);
    const shutdownSpy = jest.spyOn(testAgent, 'onShutdown');

    await registry.deregister('test-agent');

    expect(registry.getAgent('test-agent')).toBeUndefined();
    expect(shutdownSpy).toHaveBeenCalled();
    expect(testAgent.metadata.healthStatus).toBe('offline');
  });
});
