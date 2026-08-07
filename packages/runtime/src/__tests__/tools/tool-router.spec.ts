import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ToolRouter } from '../../tools/tool-router.js';
import { IToolRegistry } from '../../tools/tool.types.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RuntimeContext } from '../../runtime-context.js';

describe('ToolRouter', () => {
  let router: ToolRouter;
  let registry: IToolRegistry;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    registry = {
      resolveConnector: jest.fn().mockReturnValue({ name: 'MockConnector' }),
      validateToolAccess: jest.fn().mockReturnValue(true),
    } as any;
    router = new ToolRouter(registry, eventEmitter);
  });

  it('should execute tool successfully', async () => {
    const context = new RuntimeContext('t1', 'o1');
    const response = await router.execute({ toolId: 't1', connectorId: 'c1', params: {} }, context);
    expect(response.success).toBe(true);
  });

  it('should fail on unknown connector', async () => {
    (registry.resolveConnector as jest.Mock).mockImplementation(() => { throw new Error('not found'); });
    const context = new RuntimeContext('t1', 'o1');
    const response = await router.execute({ toolId: 't1', connectorId: 'invalid', params: {} }, context);
    expect(response.success).toBe(false);
  });
});
