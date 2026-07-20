import { ModelRouter, ModelProvider } from '../model-router';
import { ModelRoutingRequest } from '@oracle69/shared';

describe('ModelRouter', () => {
  let router: ModelRouter;
  let mockProvider: ModelProvider;

  beforeEach(() => {
    router = new ModelRouter();
    mockProvider = {
      name: 'test-provider',
      generate: jest.fn().mockResolvedValue({ content: 'response', usage: { total_tokens: 100 } }),
    };
    router.registerProvider(mockProvider);
  });

  it('should route to nano for low complexity', () => {
    const request: ModelRoutingRequest = {
      taskId: '1',
      taskDescription: 'greeting',
      department: 'General',
      complexity: 2,
    };
    expect(router.route(request)).toBe('nano');
  });

  it('should route to gpt-5.6 for high complexity', () => {
    const request: ModelRoutingRequest = {
      taskId: '2',
      taskDescription: 'strategy',
      department: 'CEO',
      complexity: 9,
    };
    expect(router.route(request)).toBe('gpt-5.6');
  });

  it('should execute with usage tracking', async () => {
    const request: ModelRoutingRequest = {
      taskId: '3',
      taskDescription: 'task',
      department: 'Marketing',
      complexity: 5,
    };
    
    const result = await router.execute('agent-1', 'prompt', request);

    expect(result).toBe('response');
    expect(router.getMetrics().length).toBe(1);
    expect(router.getMetrics()[0].tokensUsed).toBe(100);
  });

  it('should fallback on failure', async () => {
    const request: ModelRoutingRequest = {
      taskId: '4',
      taskDescription: 'task',
      department: 'Marketing',
      complexity: 2, // starts with nano
    };

    (mockProvider.generate as jest.Mock)
      .mockRejectedValueOnce(new Error('nano failed'))
      .mockResolvedValueOnce({ content: 'fallback response', usage: { total_tokens: 200 } });

    const result = await router.execute('agent-1', 'prompt', request);

    expect(result).toBe('fallback response');
    expect(mockProvider.generate).toHaveBeenCalledTimes(2);
  });
});
