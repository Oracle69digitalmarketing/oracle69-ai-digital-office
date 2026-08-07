import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ExecutiveCoordinator } from '../../executive/executive-coordinator.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ExecutiveCoordinator', () => {
  let coordinator: ExecutiveCoordinator;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    coordinator = new ExecutiveCoordinator(eventEmitter);
  });

  it('should resolve conflict', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit');
    await coordinator.resolveConflict('c1');
    expect(spy).toHaveBeenCalled();
  });
});
