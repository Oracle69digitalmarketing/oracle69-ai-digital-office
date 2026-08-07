import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DepartmentManager } from '../../departments/department-manager.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

class TestManager extends DepartmentManager {}

describe('DepartmentManager', () => {
  let manager: TestManager;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    manager = new TestManager('d1', eventEmitter);
  });

  it('should delegate task', async () => {
    const loggerSpy = jest.spyOn((manager as any).logger, 'log');
    await manager.delegateTask('t1', 'a1');
    expect(loggerSpy).toHaveBeenCalled();
  });
});
