import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AuditLogger, HealthMonitor } from '../../observability/observability.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Observability', () => {
  it('AuditLogger should log entry', () => {
    const emitter = new EventEmitter2();
    const logger = new AuditLogger(emitter);
    const spy = jest.spyOn(emitter, 'emit');
    logger.logEntry({ action: 'test' });
    expect(spy).toHaveBeenCalled();
  });

  it('HealthMonitor should return healthy', () => {
    const monitor = new HealthMonitor();
    expect(monitor.checkStatus()).toBe('healthy');
  });
});
