import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ToolRouter } from '../../tools/tool-router.js';
import { IToolRegistry } from '../../tools/tool.types.js';
import { EventBus } from '../../events/event-bus.js';
import { RuntimeContext } from '../../runtime-context.js';

describe('ToolRouter', () => {
  let router: ToolRouter;
  let registry: IToolRegistry;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    registry = {
      resolveConnector: jest.fn().mockReturnValue({ name: 'MockConnector' }),
      validateToolAccess: jest.fn().mockReturnValue(true),
    } as any;
    router = new ToolRouter(registry, eventBus);
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

  it('should publish tool events through the canonical EventBus with tenant context', async () => {
    const events: { type: string; tenantId?: string; correlationId?: string }[] = [];
    eventBus.allEvents().subscribe((event) =>
      events.push({ type: event.type, tenantId: event.tenantId, correlationId: event.correlationId })
    );

    const context = new RuntimeContext('t1', 'org-1');
    await router.execute({ toolId: 't1', connectorId: 'c1', params: {} }, context);

    const started = events.find((e) => e.type === 'tool.execution.started');
    expect(started).toBeDefined();
    expect(started?.tenantId).toBe('org-1');
    expect(started?.correlationId).toBe(context.traceId);
  });
});
