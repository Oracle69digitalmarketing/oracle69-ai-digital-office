import { jest } from '@jest/globals';
import { OiWorkflowEngine } from '../services/oi-workflow.engine.js';
import { OperationsIntelligenceEventType } from '../events/oi.events.js';

describe('OiWorkflowEngine', () => {
  let engine: OiWorkflowEngine;
  let messageBus: any;
  let prisma: any;

  const activeWorkflow = {
    id: 'w1',
    status: 'in_progress',
    createdAt: new Date(),
    completedAt: null,
  };
  const completedWorkflow = {
    id: 'w2',
    status: 'completed',
    createdAt: new Date('2026-06-01T10:00:00Z'),
    completedAt: new Date('2026-06-02T10:00:00Z'),
  };
  const failedWorkflow = {
    id: 'w3',
    status: 'failed',
    createdAt: new Date('2026-06-01T10:00:00Z'),
    completedAt: null,
  };

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new OiWorkflowEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.organization.findUnique = jest.fn().mockResolvedValue({ id: 'org-1' });
    prisma.workflow.findMany = jest.fn().mockResolvedValue([]);
    prisma.workflowStepRecord.findMany = jest.fn().mockResolvedValue([]);
    prisma.oiWorkflowSnapshot.create = jest.fn().mockResolvedValue({});
    prisma.oiWorkflowSnapshot.findMany = jest.fn().mockResolvedValue([]);
  });

  it('should compute workflow health metrics and persist a snapshot', async () => {
    prisma.workflow.findMany = jest.fn().mockResolvedValue([activeWorkflow, completedWorkflow, failedWorkflow]);
    prisma.workflowStepRecord.findMany = jest.fn().mockResolvedValue([{ id: 's1' }, { id: 's2' }]);

    const result = await engine.generateSnapshot('org-1', 'Q3 2026');

    expect(result.workflowsTotal).toBe(3);
    expect(result.workflowsCompleted).toBe(1);
    expect(result.successRate).toBeCloseTo(0.3333, 4);
    expect(result.avgStages).toBe(0.67);
    expect(result.metrics.failedWorkflows).toBe(1);
    expect(result.metrics.inFlightWorkflows).toBe(1);
    expect(result.metrics.stepsTotal).toBe(2);

    expect(prisma.oiWorkflowSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', period: 'Q3 2026', workflowsTotal: 3 }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      OperationsIntelligenceEventType.WORKFLOW_UPDATED,
      expect.objectContaining({ type: OperationsIntelligenceEventType.WORKFLOW_UPDATED })
    );
  });

  it('should flag started-but-stale workflows as stalled', async () => {
    prisma.workflow.findMany = jest.fn().mockResolvedValue([
      { ...activeWorkflow, createdAt: new Date(Date.now() - 10 * 86400000) },
    ]);

    const result = await engine.compute('org-1');

    expect(result.stalledWorkflows).toBe(1);
    expect(result.metrics.inFlightWorkflows).toBe(1);
  });

  it('should not flag recent running workflows as stalled', async () => {
    prisma.workflow.findMany = jest.fn().mockResolvedValue([activeWorkflow]);

    const result = await engine.compute('org-1');

    expect(result.stalledWorkflows).toBe(0);
  });

  it('should return zeroed metrics when there is no workflow data', async () => {
    const result = await engine.compute('org-1');

    expect(result.workflowsTotal).toBe(0);
    expect(result.successRate).toBe(0);
    expect(result.avgStages).toBe(0);
    expect(result.stalledWorkflows).toBe(0);
  });

  it('should throw when the organization does not exist', async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateSnapshot('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.oiWorkflowSnapshot.create).not.toHaveBeenCalled();
  });

  it('should list persisted workflow snapshots', async () => {
    prisma.oiWorkflowSnapshot.findMany = jest.fn().mockResolvedValue([{ id: 's1' }]);

    await expect(engine.listSnapshots('org-1')).resolves.toHaveLength(1);
  });
});
