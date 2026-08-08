import { jest } from '@jest/globals';
import { OiReportService } from '../services/oi-report.service.js';
import { MissionStatus } from '@oracle69/runtime';
import { OperationsIntelligenceEventType } from '../events/oi.events.js';

describe('OiReportService', () => {
  let service: OiReportService;
  let operationsEngine: any;
  let workflowEngine: any;
  let agentEngine: any;
  let missionManager: any;
  let messageBus: any;
  let prisma: any;

  const operations = {
    period: 'Q3 2026',
    tasksTotal: 10,
    tasksCompleted: 8,
    completionRate: 0.8,
    cycleTimeAvg: 4,
    throughput: 8,
    backlog: 2,
    avgExecutionTime: 20,
    metrics: { statusBreakdown: { completed: 8, pending: 2 }, avgTaskCost: 100, activeAgents: 2 },
  };
  const workflows = {
    period: 'Q3 2026',
    workflowsTotal: 5,
    workflowsCompleted: 4,
    successRate: 0.8,
    avgStages: 2,
    stalledWorkflows: 0,
    metrics: { statusBreakdown: {}, stepsTotal: 10, failedWorkflows: 0, inFlightWorkflows: 1 },
  };
  const agents = {
    period: 'Q3 2026',
    agents: [
      { agentId: 'agent-1', agentName: 'A', tasksAssigned: 5, tasksCompleted: 4, completionRate: 0.8, utilizationRate: 0.9, avgExecutionTime: 20, status: 'active' },
    ],
    utilizationAvg: 0.9,
    completionAvg: 0.8,
    idleAgents: 0,
    metrics: { totalAgents: 1, busyAgents: 1, healthyAgents: 1, unhealthyAgents: 0 },
  };

  beforeEach(() => {
    operationsEngine = { compute: jest.fn().mockResolvedValue(operations) };
    workflowEngine = { compute: jest.fn().mockResolvedValue(workflows) };
    agentEngine = { compute: jest.fn().mockResolvedValue(agents) };
    missionManager = { createMission: jest.fn().mockResolvedValue(undefined) };
    messageBus = { publish: jest.fn() };

    service = new OiReportService(operationsEngine, workflowEngine, agentEngine, missionManager, messageBus);
    prisma = (service as any).prisma;
    prisma.oiOperationsReport.create = jest.fn().mockResolvedValue({ id: 'report-1', period: 'Q3 2026' });
    prisma.oiOperationsReport.findMany = jest.fn().mockResolvedValue([]);
  });

  it('should compose a healthy operations report and publish an event without escalation', async () => {
    const report = await service.generateReport('org-1', 'Q3 2026');

    expect(report.period).toBe('Q3 2026');
    expect(report.summary).toEqual(
      expect.objectContaining({ operations, workflows, agents })
    );
    expect(report.summary.opsScore).toBeGreaterThanOrEqual(70);

    expect(prisma.oiOperationsReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', period: 'Q3 2026' }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      OperationsIntelligenceEventType.REPORT_GENERATED,
      expect.objectContaining({ type: OperationsIntelligenceEventType.REPORT_GENERATED })
    );
    expect(missionManager.createMission).not.toHaveBeenCalled();
  });

  it('should escalate an operations mission when operational health is critical', async () => {
    operationsEngine.compute.mockResolvedValue({
      ...operations,
      tasksTotal: 0,
      tasksCompleted: 0,
      completionRate: 0,
      throughput: 0,
      backlog: 0,
    });
    workflowEngine.compute.mockResolvedValue({
      ...workflows,
      workflowsTotal: 0,
      workflowsCompleted: 0,
      successRate: 0,
    });
    agentEngine.compute.mockResolvedValue({ ...agents, agents: [], utilizationAvg: 0, idleAgents: 0, metrics: { ...agents.metrics, totalAgents: 0 } });

    await service.generateReport('org-1');

    expect(missionManager.createMission).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'critical', owner: 'operations-intelligence', status: MissionStatus.DRAFT })
    );
    expect(messageBus.publish).toHaveBeenCalledWith(
      OperationsIntelligenceEventType.OPS_ALERT_REQUIRED,
      expect.objectContaining({ type: OperationsIntelligenceEventType.OPS_ALERT_REQUIRED })
    );
  });

  it('should throw when the organization does not exist', async () => {
    operationsEngine.compute.mockRejectedValue(new Error('Organization not found'));

    await expect(service.generateReport('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.oiOperationsReport.create).not.toHaveBeenCalled();
  });

  it('should list persisted operations reports', async () => {
    prisma.oiOperationsReport.findMany = jest.fn().mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);

    await expect(service.listReports('org-1')).resolves.toHaveLength(2);
  });
});
