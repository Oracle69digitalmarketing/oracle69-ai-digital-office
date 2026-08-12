import { jest, describe, it, expect } from '@jest/globals';
import {
  InMemoryMissionRepository,
  PrismaMissionRepository,
  MissionConflictError,
} from '../../persistence/mission.repository.js';
import { Mission, MissionStatus } from '../../missions/mission.types.js';

const mission = (overrides: Partial<Mission> = {}): Mission => ({
  id: 'm1',
  goal: 'Test mission',
  priority: 'normal',
  deadline: '2026-12-31T00:00:00.000Z',
  owner: 'ceo',
  status: MissionStatus.DRAFT,
  tenantId: 'org-1',
  ...overrides,
});

describe('InMemoryMissionRepository', () => {
  it('should persist a mission and expose it durably', async () => {
    const repo = new InMemoryMissionRepository();
    const created = await repo.create(mission());

    expect(created.version).toBe(1);
    const reloaded = await repo.findById('m1');
    expect(reloaded?.goal).toBe('Test mission');
    expect(reloaded?.tenantId).toBe('org-1');
  });

  it('should reject a duplicate missionKey within the same tenant', async () => {
    const repo = new InMemoryMissionRepository();
    await repo.create(mission({ missionKey: 'ops-recovery' }));

    await expect(repo.create(mission({ id: 'm2', missionKey: 'ops-recovery' }))).rejects.toThrow(MissionConflictError);
  });

  it('should allow the same missionKey in a different tenant', async () => {
    const repo = new InMemoryMissionRepository();
    await repo.create(mission({ missionKey: 'ops-recovery', tenantId: 'org-a' }));
    await expect(repo.create(mission({ id: 'm2', missionKey: 'ops-recovery', tenantId: 'org-b' }))).resolves.toBeDefined();
  });

  it('should scope findById to the tenant', async () => {
    const repo = new InMemoryMissionRepository();
    await repo.create(mission({ tenantId: 'org-a' }));

    expect(await repo.findById('m1', 'org-a')).not.toBeNull();
    expect(await repo.findById('m1', 'org-b')).toBeNull();
  });

  it('should list missions per tenant with an optional status filter', async () => {
    const repo = new InMemoryMissionRepository();
    await repo.create(mission({ id: 'a1', tenantId: 'org-a', status: MissionStatus.RUNNING }));
    await repo.create(mission({ id: 'a2', tenantId: 'org-a', status: MissionStatus.COMPLETED }));
    await repo.create(mission({ id: 'b1', tenantId: 'org-b', status: MissionStatus.RUNNING }));

    expect((await repo.findByTenant('org-a')).map((m) => m.id)).toEqual(['a1', 'a2']);
    expect((await repo.findByTenant('org-a', MissionStatus.RUNNING)).map((m) => m.id)).toEqual(['a1']);
  });

  it('should report only interrupted missions for recovery', async () => {
    const repo = new InMemoryMissionRepository();
    await repo.create(mission({ id: 'r1', status: MissionStatus.RUNNING, tenantId: 'org-a' }));
    await repo.create(mission({ id: 'p1', status: MissionStatus.PAUSED, tenantId: 'org-a' }));
    await repo.create(mission({ id: 'c1', status: MissionStatus.COMPLETED, tenantId: 'org-a' }));

    const interrupted = await repo.findInterrupted('org-a');
    expect(interrupted.map((m) => m.id).sort()).toEqual(['p1', 'r1']);
  });
});

describe('PrismaMissionRepository', () => {
  it('should translate a unique-constraint violation into a MissionConflictError', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const prisma = { mission: { create } } as any;
    const repo = new PrismaMissionRepository(prisma);

    await expect(repo.create(mission({ missionKey: 'ops' }))).rejects.toThrow(MissionConflictError);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ missionKey: 'ops', organizationId: 'org-1' }),
    });
  });

  it('should persist the tenant on the organizationId column', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'm1',
      goal: 'Test mission',
      priority: 'normal',
      deadline: new Date('2026-12-31T00:00:00.000Z'),
      owner: 'ceo',
      status: 'draft',
      missionKey: 'mk-1',
      workflowId: null,
      planId: null,
      executionId: 'exec-1',
      correlationId: 'corr-1',
      error: null,
      organizationId: 'org-1',
    });
    const prisma = { mission: { create } } as any;
    const repo = new PrismaMissionRepository(prisma);

    const created = await repo.create(mission({ missionKey: 'mk-1', executionId: 'exec-1', correlationId: 'corr-1' }));

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ missionKey: 'mk-1', organizationId: 'org-1', executionId: 'exec-1' }),
    });
    expect(created.tenantId).toBe('org-1');
    expect(created.executionId).toBe('exec-1');
  });
});
