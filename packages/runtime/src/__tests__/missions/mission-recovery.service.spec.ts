import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MissionRecoveryService } from '../../missions/mission-recovery.service.js';
import { MissionManager } from '../../missions/mission-manager.js';
import { MissionRegistry } from '../../missions/mission-registry.js';
import { EventBus } from '../../events/event-bus.js';
import { RuntimeEventType } from '../../events/runtime.events.js';
import { InMemoryMissionRepository } from '../../persistence/mission.repository.js';
import { Mission, MissionStatus } from '../../missions/mission.types.js';

const mission = (overrides: Partial<Mission> = {}): Mission => ({
  id: 'm1',
  goal: 'Test mission',
  priority: 'normal',
  deadline: '2026-12-31T00:00:00.000Z',
  owner: 'ceo',
  status: MissionStatus.RUNNING,
  tenantId: 'org-1',
  ...overrides,
});

describe('MissionRecoveryService', () => {
  let eventBus: EventBus;
  let manager: MissionManager;
  let service: MissionRecoveryService;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new MissionManager(new MissionRegistry(new InMemoryMissionRepository()), eventBus);
    service = new MissionRecoveryService(manager);
  });

  it('should recover interrupted missions through the mission manager', async () => {
    await manager.createMission(mission({ id: 'm-running', status: MissionStatus.RUNNING }));
    await manager.createMission(mission({ id: 'm-paused', status: MissionStatus.PAUSED }));

    const recovered = await service.recover('org-1');

    expect(recovered.map((m) => m.id).sort()).toEqual(['m-paused', 'm-running']);
    for (const r of recovered) {
      expect(r.status).toBe(MissionStatus.RECOVERED);
    }
  });

  it('should not touch completed missions during recovery', async () => {
    await manager.createMission(mission({ id: 'm-completed', status: MissionStatus.COMPLETED }));

    const recovered = await service.recover('org-1');

    expect(recovered).toEqual([]);
  });

  it('should re-emit MISSION_RECOVERED events through the canonical bus', async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await manager.createMission(mission({ id: 'm-running', status: MissionStatus.RUNNING }));
    await service.recover('org-1');

    expect(published).toContain(RuntimeEventType.MISSION_RECOVERED);
  });

  it('should tolerate bootstrap failures without crashing', async () => {
    const failingManager = {
      recoverInterrupted: jest.fn().mockRejectedValue(new Error('repo down')),
    } as unknown as MissionManager;
    const failingService = new MissionRecoveryService(failingManager);

    await expect(failingService.onApplicationBootstrap()).resolves.toBeUndefined();
  });
});
