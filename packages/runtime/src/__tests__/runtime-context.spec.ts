import { RuntimeContext } from '../runtime-context.js';

describe('RuntimeContext', () => {
  it('should generate a unique traceId and record startTime', () => {
    const ctx1 = new RuntimeContext('t1', 'o1');
    const ctx2 = new RuntimeContext('t1', 'o1');
    
    expect(ctx1.traceId).toBeDefined();
    expect(ctx2.traceId).toBeDefined();
    expect(ctx1.traceId).not.toBe(ctx2.traceId);
    expect(ctx1.startTime).toBeDefined();
    expect(new Date(ctx1.startTime).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should store and retrieve metadata', () => {
    const ctx = new RuntimeContext('t1', 'o1', { initial: 'data' });
    expect(ctx.get('initial')).toBe('data');
    
    ctx.set('new', 'value');
    expect(ctx.get('new')).toBe('value');
  });
});
