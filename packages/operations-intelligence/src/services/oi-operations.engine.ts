import { Injectable, Logger } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import {
  OperationsIntelligenceEventType,
  OperationsIntelligenceEvent,
} from "../events/oi.events.js";
import { currentPeriod } from "../utils/period.js";

export interface OperationsMetrics {
  period: string;
  tasksTotal: number;
  tasksCompleted: number;
  completionRate: number;
  cycleTimeAvg: number | null;
  throughput: number;
  backlog: number;
  avgExecutionTime: number | null;
  metrics: {
    statusBreakdown: Record<string, number>;
    avgTaskCost: number;
    activeAgents: number;
  };
}

const COMPLETED_STATUSES = ["completed", "done"];
const CANCELLED_STATUSES = ["cancelled", "canceled"];

/**
 * Computes deterministic operational KPIs for the organization from the
 * workforce task backlog: completion rate, cycle time, throughput, backlog
 * and execution-time averages. These metrics power Operational Optimization
 * (Growth Intelligence) and are persisted as snapshots for trend analysis.
 */
@Injectable()
export class OiOperationsEngine {
  private readonly logger = new Logger(OiOperationsEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Deterministically computes the operational metrics without side effects.
   */
  async compute(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<OperationsMetrics> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) throw new Error("Organization not found");

    const tasks = await this.prisma.task.findMany({
      where: { project: { organizationId } },
    });

    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter((task) => COMPLETED_STATUSES.includes(task.status)).length;
    const cancelled = tasks.filter((task) => CANCELLED_STATUSES.includes(task.status)).length;
    const backlog = Math.max(0, tasksTotal - tasksCompleted - cancelled);
    const completionRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;

    const cycleTimes = tasks
      .filter((task) => COMPLETED_STATUSES.includes(task.status))
      .map((task) => {
        const hours = (task.updatedAt.getTime() - task.createdAt.getTime()) / 3600000;
        return hours >= 0 ? hours : null;
      })
      .filter((value): value is number => value !== null);

    const cycleTimeAvg = cycleTimes.length > 0 ? average(cycleTimes) : null;

    const executionTimes = tasks
      .map((task) => task.executionTime)
      .filter((value): value is number => typeof value === "number");

    const avgExecutionTime = executionTimes.length > 0 ? average(executionTimes) : null;

    const costs = tasks
      .map((task) => task.estimatedCost)
      .filter((value): value is number => typeof value === "number");

    const statusBreakdown: Record<string, number> = {};
    for (const task of tasks) {
      statusBreakdown[task.status] = (statusBreakdown[task.status] ?? 0) + 1;
    }

    const activeAgents = new Set(
      tasks.map((task) => task.assignedAgentId).filter((id): id is string => id !== null),
    ).size;

    return {
      period,
      tasksTotal,
      tasksCompleted,
      completionRate: round(completionRate, 4),
      cycleTimeAvg: cycleTimeAvg !== null ? round(cycleTimeAvg, 2) : null,
      throughput: tasksCompleted,
      backlog,
      avgExecutionTime: avgExecutionTime !== null ? round(avgExecutionTime, 2) : null,
      metrics: {
        statusBreakdown,
        avgTaskCost: costs.length > 0 ? round(average(costs), 2) : 0,
        activeAgents,
      },
    };
  }

  /**
   * Computes, persists and publishes the operational snapshot.
   */
  async generateSnapshot(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<OperationsMetrics> {
    this.logger.log(
      `Generating operations snapshot for organization ${organizationId}, period ${period}`,
    );

    const metrics = await this.compute(organizationId, period);

    await this.prisma.oiOperationsSnapshot.create({
      data: {
        organizationId,
        period,
        tasksTotal: metrics.tasksTotal,
        tasksCompleted: metrics.tasksCompleted,
        completionRate: metrics.completionRate,
        cycleTimeAvg: metrics.cycleTimeAvg,
        throughput: metrics.throughput,
        backlog: metrics.backlog,
        avgExecutionTime: metrics.avgExecutionTime,
        metrics: metrics.metrics as unknown as object,
      },
    });

    this.messageBus.publish(
      OperationsIntelligenceEventType.OPERATIONS_UPDATED,
      new OperationsIntelligenceEvent(OperationsIntelligenceEventType.OPERATIONS_UPDATED, {
        organizationId,
        period,
        metrics,
      }),
    );

    return metrics;
  }

  /**
   * Lists the persisted operational snapshots for the organization.
   */
  async listSnapshots(organizationId: string, take = 50) {
    return this.prisma.oiOperationsSnapshot.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
