import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ExecutiveCoordinator } from '../../executive/executive-coordinator.js';
import { EventBus } from '../../events/event-bus.js';
import { ExecutiveEventType } from '../../executive/executive-events.js';

describe('ExecutiveCoordinator', () => {
  let coordinator: ExecutiveCoordinator;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    coordinator = new ExecutiveCoordinator(eventBus);
  });

  it('should resolve conflict and publish a canonical event', async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await coordinator.resolveConflict('c1');

    expect(published).toContain(ExecutiveEventType.ENTERPRISE_CONFLICT_RESOLVED);
  });
});
