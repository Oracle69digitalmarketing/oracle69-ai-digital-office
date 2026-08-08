import { Injectable, Logger } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { OperationsIntelligenceEventType, OperationsIntelligenceEvent } from '../events/oi.events.js';
import { currentPeriod } from '../utils/period.js';

export interface WorkflowMetrics {
  period: string;
  workflowsTotal: number;
  workflowsCompleted: number;
  successRate: number;
  avgStages: number;
  stalledWorkflows: number;
  metrics: {
    statusBreakdown: Record<string, number>;
    stepsTotal: number;
    failedWorkflows: number;
    inFlightWorkflows: number;
  };
}

const COMPLETED_STATUSES = ['completed', 'done'];
const FAILED_STATUSES = ['failed', 'error'];
const CANCELLED_STATUSES = ['cancelled', 'canceled'];
const RUNNING_STATUSES = ['in_progress', 'running', 'waiting', 'paused', 'retrying', 'ready'];

const STALLED_AFTER_DAYS = 7;

/**
 * Computes deterministic workflow health for the organization: success rate,
 * average stage count and stalled workflow detection. Stalled workflows are
 * those that started but have not finished within a documented staleness
 * window, signalling operational bottlenecks.
 */
@Injectable()
export class OiWorkflowEngine {
  private readonly logger = new Logger(OiWorkflowEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Deterministically computes the workflow metrics without side effects.
   */
  async compute(organizationId: string, period: string = currentPeriod()): Promise<WorkflowMetrics> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) throw new Error('Organization not found');

    const workflows = await this.prisma.workflow.findMany({
      where: { project: { organizationId } },
    });

    const steps = await this.prisma.workflowStepRecord.findMany({
      where: { organizationId },
    });

    const workflowsTotal = workflows.length;
    const workflowsCompleted = workflows.filter((workflow) =>
      COMPLETED_STATUSES.includes(workflow.status)
    ).length;
    const failedWorkflows = workflows.filter((workflow) =>
      FAILED_STATUSES.includes(workflow.status)
    ).length;
    const runningWorkflows = workflows.filter((workflow) =>
      RUNNING_STATUSES.includes(workflow.status)
    );
    const successRate = workflowsTotal > 0 ? workflowsCompleted / workflowsTotal : 0;
    const avgStages = workflowsTotal > 0 ? steps.length / workflowsTotal : 0;

    const stalenessCutoff = new Date(Date.now() - STALLED_AFTER_DAYS * 86400000);
    const stalledWorkflows = runningWorkflows.filter(
      (workflow) => workflow.createdAt < stalenessCutoff
    ).length;

    const statusBreakdown: Record<string, number> = {};
    for (const workflow of workflows) {
      statusBreakdown[workflow.status] = (statusBreakdown[workflow.status] ?? 0) + 1;
    }

    return {
      period,
      workflowsTotal,
      workflowsCompleted,
      successRate: round(successRate, 4),
      avgStages: round(avgStages, 2),
      stalledWorkflows,
      metrics: {
        statusBreakdown,
        stepsTotal: steps.length,
        failedWorkflows,
        inFlightWorkflows: runningWorkflows.length,
      },
    };
  }

  /**
   * Computes, persists and publishes the workflow snapshot.
   */
  async generateSnapshot(organizationId: string, period: string = currentPeriod()): Promise<WorkflowMetrics> {
    this.logger.log(`Generating workflow snapshot for organization ${organizationId}, period ${period}`);

    const metrics = await this.compute(organizationId, period);

    await this.prisma.oiWorkflowSnapshot.create({
      data: {
        organizationId,
        period,
        workflowsTotal: metrics.workflowsTotal,
        workflowsCompleted: metrics.workflowsCompleted,
        successRate: metrics.successRate,
        avgStages: metrics.avgStages,
        stalledWorkflows: metrics.stalledWorkflows,
        metrics: metrics.metrics as unknown as object,
      },
    });

    this.messageBus.publish(
      OperationsIntelligenceEventType.WORKFLOW_UPDATED,
      new OperationsIntelligenceEvent(OperationsIntelligenceEventType.WORKFLOW_UPDATED, {
        organizationId,
        period,
        metrics,
      })
    );

    return metrics;
  }

  /**
   * Lists the persisted workflow snapshots for the organization.
   */
  async listSnapshots(organizationId: string, take = 50) {
    return this.prisma.oiWorkflowSnapshot.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
