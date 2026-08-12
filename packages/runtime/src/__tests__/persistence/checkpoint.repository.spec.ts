import { jest, describe, it, expect } from '@jest/globals';
import {
  InMemoryCheckpointRepository,
  PrismaCheckpointRepository,
} from '../../persistence/checkpoint.repository.js';

describe('InMemoryCheckpointRepository', () => {
  it('should persist checkpoints with monotonically increasing versions', async () => {
    const repo = new InMemoryCheckpointRepository();

    const first = await repo.save('m1', { step: 1 }, 'org-1');
    const second = await repo.save('m1', { step: 2 }, 'org-1');

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
  });

  it('should return the most recent checkpoint for a mission', async () => {
    const repo = new InMemoryCheckpointRepository();
    await repo.save('m1', { step: 1 }, 'org-1');
    await repo.save('m1', { step: 2 }, 'org-1');

    const latest = await repo.latest('m1');
    expect(latest?.version).toBe(2);
    expect(latest?.state).toEqual({ step: 2 });
  });

  it('should scope checkpoints by tenant', async () => {
    const repo = new InMemoryCheckpointRepository();
    await repo.save('m1', { step: 1 }, 'org-a');
    await repo.save('m1', { step: 2 }, 'org-b');

    expect((await repo.latest('m1', 'org-a'))?.state).toEqual({ step: 1 });
    expect((await repo.listForMission('m1', 'org-b')).map((c) => c.version)).toEqual([1]);
  });

  it('should return null when a mission has no checkpoint', async () => {
    const repo = new InMemoryCheckpointRepository();
    expect(await repo.latest('m1')).toBeNull();
  });
});

describe('PrismaCheckpointRepository', () => {
  it('should persist a checkpoint with the tenant scoped to organizationId', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'cp-1',
      missionId: 'm1',
      version: 3,
      state: { step: 3 },
      organizationId: 'org-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const findFirst = jest.fn().mockResolvedValue({ version: 2 });
    const prisma = { missionCheckpoint: { create, findFirst } } as any;
    const repo = new PrismaCheckpointRepository(prisma);

    const checkpoint = await repo.save('m1', { step: 3 }, 'org-1');

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ missionId: 'm1', version: 3, organizationId: 'org-1' }),
    });
    expect(checkpoint.tenantId).toBe('org-1');
  });

  it('should fetch the latest checkpoint for a mission scoped to the tenant', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'cp-1',
      missionId: 'm1',
      version: 2,
      state: { step: 2 },
      organizationId: 'org-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const prisma = { missionCheckpoint: { findFirst } } as any;
    const repo = new PrismaCheckpointRepository(prisma);

    const latest = await repo.latest('m1', 'org-1');

    expect(findFirst).toHaveBeenCalledWith({
      where: { missionId: 'm1', organizationId: 'org-1' },
      orderBy: { version: 'desc' },
    });
    expect(latest?.state).toEqual({ step: 2 });
  });

  it('should fail fast when PrismaService is unavailable', async () => {
    const repo = new PrismaCheckpointRepository(undefined);
    await expect(repo.save('m1', {}, 'org-1')).rejects.toThrow(/PrismaService is not available/);
  });
});
