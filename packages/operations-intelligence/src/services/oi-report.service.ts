import { Injectable, Logger } from "@nestjs/common";
import { MessageBus, MissionManager, MissionStatus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import {
  OperationsIntelligenceEventType,
  OperationsIntelligenceEvent,
} from "../events/oi.events.js";
import { OiOperationsEngine } from "./oi-operations.engine.js";
import { OiWorkflowEngine } from "./oi-workflow.engine.js";
import { OiAgentEngine } from "./oi-agent.engine.js";
import { currentPeriod } from "../utils/period.js";

/**
 * Composes the operations intelligence engines into an operational report,
 * persists it, publishes an event and escalates a mission through the existing
 * MissionManager whenever the operational score falls into critical territory —
 * Growth Intelligence does not only report, it acts.
 */
@Injectable()
export class OiReportService {
  private readonly logger = new Logger(OiReportService.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly operationsEngine: OiOperationsEngine,
    private readonly workflowEngine: OiWorkflowEngine,
    private readonly agentEngine: OiAgentEngine,
    private readonly missionManager: MissionManager,
    private readonly messageBus: MessageBus,
  ) {}

  async generateReport(organizationId: string, period: string = currentPeriod()) {
    this.logger.log(
      `Generating operations report for organization ${organizationId}, period ${period}`,
    );

    const operations = await this.operationsEngine.compute(organizationId, period);
    const workflows = await this.workflowEngine.compute(organizationId, period);
    const agents = await this.agentEngine.compute(organizationId, period);

    const opsScore = computeOpsScore(operations, workflows, agents);

    const summary = {
      period,
      opsScore,
      operations,
      workflows,
      agents,
    };

    const report = await this.prisma.oiOperationsReport.create({
      data: {
        organizationId,
        period,
        opsScore,
        summary: summary as unknown as object,
      },
    });

    this.messageBus.publish(
      OperationsIntelligenceEventType.REPORT_GENERATED,
      new OperationsIntelligenceEvent(OperationsIntelligenceEventType.REPORT_GENERATED, {
        organizationId,
        reportId: report.id,
        period,
        opsScore,
      }),
    );

    if (opsScore < OPS_ALERT_THRESHOLD) {
      const missionId = uuidv4();
      await this.missionManager.createMission({
        id: missionId,
        goal:
          `Operations intelligence: the operational score is ${Math.round(opsScore)}/100 (below ` +
          `${OPS_ALERT_THRESHOLD}) for organization ${organizationId}. Execute the operational recovery plan.`,
        priority: "critical",
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        owner: "operations-intelligence",
        status: MissionStatus.DRAFT,
        tenantId: organizationId,
      });

      this.messageBus.publish(
        OperationsIntelligenceEventType.OPS_ALERT_REQUIRED,
        new OperationsIntelligenceEvent(OperationsIntelligenceEventType.OPS_ALERT_REQUIRED, {
          organizationId,
          missionId,
          opsScore,
        }),
      );
    }

    return { id: report.id, period, summary };
  }

  async listReports(organizationId: string, take = 20) {
    return this.prisma.oiOperationsReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

const OPS_ALERT_THRESHOLD = 45;

function computeOpsScore(operations: any, workflows: any, agents: any): number {
  let score = 50;

  score += Math.min(30, operations.completionRate * 30);
  score += Math.min(20, workflows.successRate * 20);
  score += Math.min(10, operations.throughput * 2);
  score += Math.min(10, agents.utilizationAvg * 20);

  if (operations.backlog > operations.tasksCompleted) {
    score -= 15;
  }
  if (workflows.stalledWorkflows > 0) {
    score -= 10;
  }
  if (agents.idleAgents === agents.metrics.totalAgents && agents.metrics.totalAgents > 0) {
    score -= 10;
  }
  if (operations.tasksTotal === 0 && workflows.workflowsTotal === 0) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
