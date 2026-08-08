import { jest } from '@jest/globals';
import { OiOperationsEngine } from '../services/oi-operations.engine.js';
import { OperationsIntelligenceEventType } from '../events/oi.events.js';

describe('OiOperationsEngine', () => {
  let engine: OiOperationsEngine;
  let messageBus: any;
  let prisma: any;

  const completedTask = {
    id: 't1',
    status: 'completed',
    executionTime: 30,
    estimatedCost: 100,
    assignedAgentId: 'agent-1',
    createdAt: new Date('2026-07-01T10:00:00Z'),
    updatedAt: new Date('2026-07-01T12:00:00Z'),
  };
  const pendingTask = {
    id: 't2',
    status: 'pending',
    executionTime: null,
    estimatedCost: null,
    assignedAgentId: null,
    createdAt: new Date('2026-07-01T10:00:00Z'),
    updatedAt: new Date('2026-07-01T10:00:00Z'),
  };

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new OiOperationsEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.task.findMany = jest.fn().mockResolvedValue([]);
    prisma.oiOperationsSnapshot.create = jest.fn().mockResolvedValue({});
    prisma.oiOperationsSnapshot.findMany = jest.fn().mockResolvedValue([]);
  });

  function mockOrganization() {
    prisma.organization.findUnique = jest.fn().mockResolvedValue({ id: 'org-1' });
  }

  it('should compute operational metrics from tasks and persist a snapshot', async () => {
    mockOrganization();
    prisma.task.findMany = jest.fn().mockResolvedValue([completedTask, pendingTask]);

    const result = await engine.generateSnapshot('org-1', 'Q3 2026');

    expect(result.tasksTotal).toBe(2);
    expect(result.tasksCompleted).toBe(1);
    expect(result.completionRate).toBeCloseTo(0.5, 4);
    expect(result.throughput).toBe(1);
    expect(result.backlog).toBe(1);
    expect(result.cycleTimeAvg).toBe(2);
    expect(result.avgExecutionTime).toBe(30);
    expect(result.metrics.avgTaskCost).toBe(100);
    expect(result.metrics.activeAgents).toBe(1);
    expect(result.metrics.statusBreakdown).toEqual({ completed: 1, pending: 1 });

    expect(prisma.oiOperationsSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', period: 'Q3 2026', tasksTotal: 2 }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      OperationsIntelligenceEventType.OPERATIONS_UPDATED,
      expect.objectContaining({ type: OperationsIntelligenceEventType.OPERATIONS_UPDATED })
    );
  });

  it('should return zeroed metrics when there is no task data', async () => {
    mockOrganization();

    const result = await engine.compute('org-1');

    expect(result.tasksTotal).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.cycleTimeAvg).toBeNull();
    expect(result.avgExecutionTime).toBeNull();
    expect(result.metrics.activeAgents).toBe(0);
  });

  it('should handle cancelled tasks as neither completed nor backlog', async () => {
    mockOrganization();
    prisma.task.findMany = jest.fn().mockResolvedValue([
      completedTask,
      { ...pendingTask, id: 't3', status: 'cancelled' },
    ]);

    const result = await engine.compute('org-1');

    expect(result.tasksCompleted).toBe(1);
    expect(result.backlog).toBe(0);
    expect(result.completionRate).toBeCloseTo(0.5, 4);
  });

  it('should throw when the organization does not exist', async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateSnapshot('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.oiOperationsSnapshot.create).not.toHaveBeenCalled();
  });

  it('should list persisted operational snapshots', async () => {
    prisma.oiOperationsSnapshot.findMany = jest.fn().mockResolvedValue([{ id: 's1' }]);

    await expect(engine.listSnapshots('org-1')).resolves.toHaveLength(1);
  });
});
