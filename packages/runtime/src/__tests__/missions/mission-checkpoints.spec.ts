import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MissionCheckpoints } from '../../missions/mission-checkpoints.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('MissionCheckpoints', () => {
  let checkpoints: MissionCheckpoints;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    checkpoints = new MissionCheckpoints(eventEmitter);
  });

  it('should save checkpoint', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit');
    await checkpoints.saveCheckpoint('m1', 'state');
    expect(spy).toHaveBeenCalled();
  });
});
