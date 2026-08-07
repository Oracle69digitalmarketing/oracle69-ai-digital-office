import { jest } from '@jest/globals';
import { RuntimeManager } from '../runtime-manager.js';
import { RuntimeState } from '../runtime.types.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('RuntimeManager', () => {
  let manager: RuntimeManager;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    manager = new RuntimeManager(eventEmitter);
  });

  it('should initialize to READY state', async () => {
    expect(manager.getState()).toBe(RuntimeState.UNINITIALIZED);
    await manager.initialize();
    expect(manager.getState()).toBe(RuntimeState.READY);
  });

  it('should transition through states during initialize', async () => {
    const states: RuntimeState[] = [];
    jest.spyOn(eventEmitter, 'emit').mockImplementation((type) => {
      if (type === 'runtime.started') states.push(RuntimeState.STARTING);
      if (type === 'runtime.ready') states.push(RuntimeState.READY);
      return true;
    });

    await manager.initialize();
    expect(states).toContain(RuntimeState.STARTING);
    expect(states).toContain(RuntimeState.READY);
  });

  it('should shut down correctly', async () => {
    await manager.initialize();
    await manager.shutdown();
    expect(manager.getState()).toBe(RuntimeState.STOPPED);
  });

  it('should create execution context', () => {
    const context = manager.createContext('task-1', 'org-1');
    expect(context.taskId).toBe('task-1');
    expect(context.orgId).toBe('org-1');
    expect(context.traceId).toBeDefined();
    expect(context.startTime).toBeDefined();
  });

  it('should provide access to the registry', () => {
    const registry = manager.getRegistry();
    expect(registry).toBeDefined();
  });
});
