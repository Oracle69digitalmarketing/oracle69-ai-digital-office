import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MemoryManager } from '../../memory/memory-manager.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('MemoryManager', () => {
  let manager: MemoryManager;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    manager = new MemoryManager(eventEmitter);
  });

  it('should save and retrieve memory', async () => {
    const record = { id: 'm1', type: 'working' as any, content: 'data', timestamp: 'now' };
    await manager.save(record);
    const results = await manager.retrieve('data');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('m1');
  });
});
