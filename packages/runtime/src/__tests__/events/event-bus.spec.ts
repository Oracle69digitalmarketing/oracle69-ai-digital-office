import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EventBus, EventLogSink } from '../../events/event-bus.js';
import { RuntimeEvent, RuntimeEventType } from '../../events/runtime.events.js';
import { EventCatalogService } from '../../events/event-catalog.js';
import { TenantContextService } from '../../tenancy/tenant-context.js';
import { RuntimeContext } from '../../runtime-context.js';
import { MessageBus } from '../../communication/message-bus.js';

describe('EventBus (canonical event infrastructure)', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should deliver published events to subscribers by canonical type', () => {
    const received: RuntimeEvent<unknown>[] = [];
    bus.subscribe(RuntimeEventType.RUNTIME_READY, (event) => {
      received.push(event);
    });

    bus.publish(RuntimeEventType.RUNTIME_READY, { ready: true }, { source: 'Test' });

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe(RuntimeEventType.RUNTIME_READY);
    expect(received[0].payload).toEqual({ ready: true });
    expect(received[0].eventId).toBeDefined();
  });

  it('should not deliver events of a different canonical type', () => {
    const received: RuntimeEvent<unknown>[] = [];
    bus.subscribe(RuntimeEventType.PLANNING_STARTED, (event) => {
      received.push(event);
    });

    bus.publish(RuntimeEventType.RUNTIME_READY, {});

    expect(received).toHaveLength(0);
  });

  it('should accept a fully-formed RuntimeEvent for publication', () => {
    const received: RuntimeEvent<unknown>[] = [];
    bus.subscribe('custom.event', (event) => {
      received.push(event);
    });

    const event = new RuntimeEvent('custom.event', { value: 42 }, { source: 'Direct' });
    bus.publish(event);

    expect(received).toHaveLength(1);
    expect(received[0].eventId).toBe(event.eventId);
    expect(received[0].source).toBe('Direct');
  });

  it('should attach consistent metadata to every event', () => {
    const events: RuntimeEvent<unknown>[] = [];
    bus.allEvents().subscribe((event) => events.push(event));

    bus.publish(RuntimeEventType.TOOL_EXECUTION_STARTED, {}, { source: 'ToolRouter' });

    const event = events[0];
    expect(event.eventId).toBeDefined();
    expect(event.timestamp).toBeLessThanOrEqual(Date.now());
    expect(event.source).toBe('ToolRouter');
    expect(event.version).toBe('1.0.0');
    expect(event.metadata).toBeDefined();
  });

  it('should propagate tenant context from RuntimeContext', () => {
    const events: RuntimeEvent<unknown>[] = [];
    bus.allEvents().subscribe((event) => events.push(event));

    const context = new RuntimeContext('task-1', 'org-1');
    bus.publish(RuntimeEventType.PLANNING_STARTED, { goal: 'g' }, { context });

    expect(events[0].tenantId).toBe('org-1');
    expect(events[0].correlationId).toBe(context.traceId);
    expect(events[0].executionId).toBe('task-1');
  });

  it('should carry explicit correlation and idempotency information', () => {
    const events: RuntimeEvent<unknown>[] = [];
    bus.allEvents().subscribe((event) => events.push(event));

    bus.publish(
      RuntimeEventType.MISSION_STARTED,
      { missionId: 'm1' },
      { correlationId: 'corr-1', causationId: 'cause-1', idempotencyKey: 'idem-1', missionId: 'm1' }
    );

    expect(events[0].correlationId).toBe('corr-1');
    expect(events[0].causationId).toBe('cause-1');
    expect(events[0].idempotencyKey).toBe('idem-1');
    expect(events[0].missionId).toBe('m1');
  });

  it('should invoke async handlers and surface rejected promises via onError', async () => {
    const errors: { error: Error; event?: RuntimeEvent<unknown> }[] = [];
    bus.onError((error, event) => errors.push({ error, event }));

    bus.subscribe(RuntimeEventType.WORKFLOW_STARTED, async () => {
      throw new Error('async failure');
    });

    bus.publish(RuntimeEventType.WORKFLOW_STARTED, { workflowId: 'wf-1' });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(errors).toHaveLength(1);
    expect(errors[0].error.message).toBe('async failure');
    expect(errors[0].event?.type).toBe(RuntimeEventType.WORKFLOW_STARTED);
  });

  it('should catch synchronous handler errors and surface them via onError', () => {
    const errors: Error[] = [];
    bus.onError((error) => errors.push(error));

    bus.subscribe(RuntimeEventType.MEMORY_CREATED, () => {
      throw new Error('sync failure');
    });

    bus.publish(RuntimeEventType.MEMORY_CREATED, {});

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('sync failure');
  });

  it('should deliver every event to registered EventLog sinks', async () => {
    const recorded: RuntimeEvent<unknown>[] = [];
    const sink: EventLogSink = {
      write: (event) => {
        recorded.push(event);
      },
    };
    bus.registerLogSink(sink);

    bus.publish(RuntimeEventType.AUDIT_ENTRY_CREATED, { action: 'test' }, { source: 'AuditLogger' });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(recorded).toHaveLength(1);
    expect(recorded[0].type).toBe(RuntimeEventType.AUDIT_ENTRY_CREATED);
  });

  it('should surface recorder failures via onError without breaking the bus', async () => {
    const errors: Error[] = [];
    bus.onError((error) => errors.push(error));
    bus.registerLogSink({
      write: () => {
        throw new Error('persist failure');
      },
    });

    bus.publish(RuntimeEventType.RUNTIME_HEALTH_CHANGED, {});

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('persist failure');

    const received: RuntimeEvent<unknown>[] = [];
    bus.subscribe(RuntimeEventType.RUNTIME_READY, (event) => received.push(event));
    bus.publish(RuntimeEventType.RUNTIME_READY, {});
    expect(received).toHaveLength(1);
  });

  it('should expose typed ofType and allEvents observables', () => {
    const typed: RuntimeEvent<unknown>[] = [];
    bus.ofType<{ goal: string }>(RuntimeEventType.PLANNING_COMPLETED).subscribe((event) => {
      typed.push(event);
    });

    bus.publish(RuntimeEventType.PLANNING_COMPLETED, { goal: 'g' });
    bus.publish(RuntimeEventType.WORKFLOW_COMPLETED, { workflowId: 'wf' });

    expect(typed).toHaveLength(1);
    expect(typed[0].payload).toEqual({ goal: 'g' });
  });

  it('should stop delivering events after complete', () => {
    const received: RuntimeEvent<unknown>[] = [];
    bus.subscribe(RuntimeEventType.RUNTIME_STARTED, (event) => received.push(event));

    bus.complete();
    bus.publish(RuntimeEventType.RUNTIME_STARTED, {});

    expect(received).toHaveLength(0);
  });
});

describe('EventBus (idempotency and identifier propagation)', () => {
  it('should suppress re-publication of an event with the same idempotency key', () => {
    const bus = new EventBus();
    const received: string[] = [];
    bus.subscribe(RuntimeEventType.MISSION_CREATED, (event) => received.push(event.eventId));

    const first = bus.publish(
      RuntimeEventType.MISSION_CREATED,
      { missionId: 'm1' },
      { idempotencyKey: 'mission.created:m1:org-1' }
    );
    const second = bus.publish(
      RuntimeEventType.MISSION_CREATED,
      { missionId: 'm1' },
      { idempotencyKey: 'mission.created:m1:org-1' }
    );

    expect(second.eventId).toBe(first.eventId);
    expect(received).toHaveLength(1);
    expect(bus.getByIdempotencyKey('mission.created:m1:org-1')?.eventId).toBe(first.eventId);
  });

  it('should not suppress events with distinct idempotency keys', () => {
    const bus = new EventBus();
    const received: string[] = [];
    bus.subscribe(RuntimeEventType.MISSION_CREATED, (event) => received.push(event.eventId));

    bus.publish(RuntimeEventType.MISSION_CREATED, {}, { idempotencyKey: 'k1' });
    bus.publish(RuntimeEventType.MISSION_CREATED, {}, { idempotencyKey: 'k2' });

    expect(received).toHaveLength(2);
  });

  it('should propagate correlation, tenant, execution, mission and workflow identifiers to causally related events', () => {
    const bus = new EventBus();
    const busEvents: RuntimeEvent<unknown>[] = [];
    bus.allEvents().subscribe((event) => busEvents.push(event));

    bus.subscribe(RuntimeEventType.MISSION_STARTED, (parent) => {
      bus.publish(RuntimeEventType.WORKFLOW_CREATED, { workflowId: 'wf-1' });
    });

    bus.publish(RuntimeEventType.MISSION_STARTED, { missionId: 'm1' }, {
      tenantId: 'org-1',
      correlationId: 'corr-1',
      executionId: 'exec-1',
      missionId: 'm1',
      workflowId: 'wf-parent',
    });

    expect(busEvents).toHaveLength(2);
    const parent = busEvents[0];
    const child = busEvents[1];

    expect(child.causationId).toBe(parent.eventId);
    expect(child.tenantId).toBe('org-1');
    expect(child.correlationId).toBe('corr-1');
    expect(child.executionId).toBe('exec-1');
    expect(child.missionId).toBe('m1');
    expect(child.workflowId).toBe('wf-parent');
  });

  it('should inherit the active TenantContextService scope when no explicit identifiers are provided', () => {
    const tenantContext = new TenantContextService();
    const bus = new EventBus(undefined, tenantContext);
    const busEvents: RuntimeEvent<unknown>[] = [];
    bus.allEvents().subscribe((event) => busEvents.push(event));

    tenantContext.run({ tenantId: 'org-scope', correlationId: 'corr-scope', executionId: 'exec-scope' }, () => {
      bus.publish(RuntimeEventType.PLANNING_STARTED, {});
    });

    expect(busEvents[0].tenantId).toBe('org-scope');
    expect(busEvents[0].correlationId).toBe('corr-scope');
    expect(busEvents[0].executionId).toBe('exec-scope');
  });

  it('should validate published types against the canonical EventCatalog', () => {
    const catalog = new EventCatalogService();
    const bus = new EventBus(catalog);
    const warnSpy = jest.spyOn((bus as any).logger, 'debug').mockImplementation(() => undefined);

    bus.publish(RuntimeEventType.RUNTIME_READY, {});
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('non-canonical'));

    bus.publish('custom.domain.event', {});
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-canonical'));
    warnSpy.mockRestore();
  });
});

describe('EventBus (duplicate/competing abstraction prevention)', () => {
  it('should be the canonical publish/subscribe path for RuntimeEventType vocabulary', () => {
    const bus = new EventBus();
    const published: string[] = [];

    bus.subscribe(RuntimeEventType.AGENT_REGISTERED, (event) => published.push(event.type));

    bus.publish(RuntimeEventType.AGENT_REGISTERED, { agentId: 'a1' });

    expect(published).toEqual([RuntimeEventType.AGENT_REGISTERED]);
  });

  it('should route MessageBus publications through the same canonical pipeline', () => {
    const events: RuntimeEvent<unknown>[] = [];
    const bus = new EventBus();
    bus.allEvents().subscribe((event) => events.push(event));

    const messageBus = new MessageBus(bus);
    messageBus.publish('crm.organization.created', new RuntimeEvent('crm.organization.created', { organization: {} }));

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('crm.organization.created');

    messageBus.publish('task.started', { taskId: 't1' });
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe('task.started');
  });
});
