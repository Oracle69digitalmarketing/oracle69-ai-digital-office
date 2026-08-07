import { RuntimeEvent, RuntimeEventType } from '../events/runtime.events.js';

describe('RuntimeEvent', () => {
  it('should create an event with correct type and payload', () => {
    const payload = { foo: 'bar' };
    const event = new RuntimeEvent(RuntimeEventType.RUNTIME_READY, payload);
    
    expect(event.type).toBe(RuntimeEventType.RUNTIME_READY);
    expect(event.payload).toEqual(payload);
    expect(event.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('should support custom string event types', () => {
    const event = new RuntimeEvent('custom.event');
    expect(event.type).toBe('custom.event');
  });
});
