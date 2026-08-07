import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ExecutiveOffice } from '../../executive/executive-office.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ExecutiveOffice', () => {
  let office: ExecutiveOffice;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    office = new ExecutiveOffice(eventEmitter);
  });

  it('should assign enterprise goal', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit');
    await office.assignEnterpriseGoal({ id: 'g1', goal: 'Test goal', priority: 'high', deadline: '2026-12-31', status: 'created' });
    expect(spy).toHaveBeenCalled();
  });
});
