import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MissionManager } from '../../missions/mission-manager.js';
import { MissionRegistry } from '../../missions/mission-registry.js';
import { MissionStatus } from '../../missions/mission.types.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('MissionManager', () => {
  let manager: MissionManager;
  let registry: MissionRegistry;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    registry = new MissionRegistry();
    manager = new MissionManager(registry, eventEmitter);
  });

  it('should create and start a mission', async () => {
    const mission = { id: 'm1', goal: 'Test', priority: 'normal', deadline: '2026-12-31', owner: 'ceo', status: MissionStatus.DRAFT } as any;
    await manager.createMission(mission);
    await manager.startMission('m1');
    expect(registry.getMission('m1')?.status).toBe(MissionStatus.RUNNING);
  });
});
