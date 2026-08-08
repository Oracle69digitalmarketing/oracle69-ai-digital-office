import { jest } from '@jest/globals';
import { EiReportService } from '../services/ei-report.service.js';
import { MissionStatus } from '@oracle69/runtime';
import { EnterpriseIntelligenceEventType } from '../events/ei.events.js';

describe('EiReportService', () => {
  let service: EiReportService;
  let kpiEngine: any;
  let healthEngine: any;
  let forecastEngine: any;
  let missionManager: any;
  let messageBus: any;
  let prisma: any;

  const kpis = { totalPipelineValue: 100000, winRate: 0.5, openOpportunities: 3, totalContacts: 5 };
  const forecast = { expectedRevenue: 120000, period: 'Q3 2026' };

  beforeEach(() => {
    kpiEngine = { compute: jest.fn().mockResolvedValue(kpis) };
    healthEngine = { compute: jest.fn().mockResolvedValue({ status: 'healthy', score: 80, reasoning: 'ok', factors: [] }) };
    forecastEngine = { compute: jest.fn().mockResolvedValue(forecast) };
    missionManager = { createMission: jest.fn().mockResolvedValue(undefined) };
    messageBus = { publish: jest.fn() };

    service = new EiReportService(kpiEngine, healthEngine, forecastEngine, missionManager, messageBus);
    prisma = (service as any).prisma;
    prisma.csSuccessPlan.count = jest.fn().mockResolvedValue(2);
    prisma.csChurnRisk.count = jest.fn().mockResolvedValue(1);
    prisma.eiEnterpriseReport.create = jest.fn().mockResolvedValue({ id: 'report-1', period: 'Q3 2026' });
    prisma.eiEnterpriseReport.findMany = jest.fn().mockResolvedValue([]);
  });

  it('should compose a report from all intelligence engines and publish an event', async () => {
    const report = await service.generateReport('org-1', 'Q3 2026');

    expect(report.period).toBe('Q3 2026');
    expect(report.summary).toEqual(
      expect.objectContaining({ kpis, forecast, health: expect.objectContaining({ status: 'healthy' }), successPlanCount: 2, churnRiskCount: 1 })
    );

    expect(prisma.eiEnterpriseReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', period: 'Q3 2026', healthScore: 80 }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.REPORT_GENERATED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.REPORT_GENERATED })
    );
    expect(missionManager.createMission).not.toHaveBeenCalled();
  });

  it('should escalate a strategic mission when business health is critical', async () => {
    healthEngine.compute.mockResolvedValue({ status: 'critical', score: 30, reasoning: 'bad', factors: [] });

    await service.generateReport('org-1');

    expect(missionManager.createMission).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'critical', owner: 'enterprise-intelligence', status: MissionStatus.DRAFT })
    );
    expect(messageBus.publish).toHaveBeenCalledWith(
      EnterpriseIntelligenceEventType.EXECUTIVE_ALERT_REQUIRED,
      expect.objectContaining({ type: EnterpriseIntelligenceEventType.EXECUTIVE_ALERT_REQUIRED })
    );
  });

  it('should throw when the organization does not exist', async () => {
    kpiEngine.compute.mockRejectedValue(new Error('Organization not found'));

    await expect(service.generateReport('missing-org')).rejects.toThrow('Organization not found');
    expect(prisma.eiEnterpriseReport.create).not.toHaveBeenCalled();
  });

  it('should list persisted reports', async () => {
    prisma.eiEnterpriseReport.findMany = jest.fn().mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);

    await expect(service.listReports('org-1')).resolves.toHaveLength(2);
  });
});
