import { Injectable, Logger } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import {
  OperationsIntelligenceEventType,
  OperationsIntelligenceEvent,
} from "../events/oi.events.js";
import { currentPeriod } from "../utils/period.js";

export interface AgentUtilizationRow {
  agentId: string;
  agentName: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  utilizationRate: number;
  avgExecutionTime: number | null;
  status: string;
}

export interface AgentUtilizationMetrics {
  period: string;
  agents: AgentUtilizationRow[];
  utilizationAvg: number;
  completionAvg: number;
  idleAgents: number;
  metrics: {
    totalAgents: number;
    busyAgents: number;
    healthyAgents: number;
    unhealthyAgents: number;
  };
}

const COMPLETED_STATUSES = ["completed", "done"];
const IN_PROGRESS_STATUSES = ["in_progress", "running", "working"];
const BUSY_STATUSES = ["busy", "active"];

/**
 * Computes deterministic agent utilization for the organization: assigned and
 * completed workload per AI employee, completion and utilization rates, and
 * average execution times. Utilization measures how much of an agent's
 * assigned workload has been actioned (started or completed), flagging idle
 * or under-performing employees for Operational Optimization.
 */
@Injectable()
export class OiAgentEngine {
  private readonly logger = new Logger(OiAgentEngine.name);
  private prisma = new PrismaClient();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Deterministically computes the agent utilization metrics without side effects.
   */
  async compute(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<AgentUtilizationMetrics> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) throw new Error("Organization not found");

    const agents = await this.prisma.agent.findMany({
      where: { organizationId },
      include: { tasks: true },
    });

    const rows: AgentUtilizationRow[] = agents.map((agent) => {
      const tasksAssigned = agent.tasks.length;
      const tasksCompleted = agent.tasks.filter((task) =>
        COMPLETED_STATUSES.includes(task.status),
      ).length;
      const tasksInProgress = agent.tasks.filter((task) =>
        IN_PROGRESS_STATUSES.includes(task.status),
      ).length;
      const completionRate = tasksAssigned > 0 ? tasksCompleted / tasksAssigned : 0;
      const utilizationRate =
        tasksAssigned > 0 ? (tasksCompleted + tasksInProgress) / tasksAssigned : 0;

      const executionTimes = agent.tasks
        .map((task) => task.executionTime)
        .filter((value): value is number => typeof value === "number");

      return {
        agentId: agent.id,
        agentName: agent.name,
        tasksAssigned,
        tasksCompleted,
        completionRate: round(completionRate, 4),
        utilizationRate: round(utilizationRate, 4),
        avgExecutionTime: executionTimes.length > 0 ? round(average(executionTimes), 2) : null,
        status: agent.status,
      };
    });

    const utilizationAvg = rows.length > 0 ? average(rows.map((row) => row.utilizationRate)) : 0;
    const completionAvg = rows.length > 0 ? average(rows.map((row) => row.completionRate)) : 0;

    return {
      period,
      agents: rows,
      utilizationAvg: round(utilizationAvg, 4),
      completionAvg: round(completionAvg, 4),
      idleAgents: rows.filter((row) => row.tasksAssigned === 0).length,
      metrics: {
        totalAgents: agents.length,
        busyAgents: agents.filter((agent) => BUSY_STATUSES.includes(agent.status)).length,
        healthyAgents: agents.filter((agent) => agent.health === "healthy").length,
        unhealthyAgents: agents.filter((agent) => agent.health !== "healthy").length,
      },
    };
  }

  /**
   * Computes, persists and publishes the agent utilization snapshot.
   */
  async generateUtilization(
    organizationId: string,
    period: string = currentPeriod(),
  ): Promise<AgentUtilizationMetrics> {
    this.logger.log(
      `Generating agent utilization for organization ${organizationId}, period ${period}`,
    );

    const metrics = await this.compute(organizationId, period);

    if (metrics.agents.length > 0) {
      await this.prisma.oiAgentUtilization.createMany({
        data: metrics.agents.map((row) => ({
          organizationId,
          period,
          agentId: row.agentId,
          agentName: row.agentName,
          tasksAssigned: row.tasksAssigned,
          tasksCompleted: row.tasksCompleted,
          completionRate: row.completionRate,
          utilizationRate: row.utilizationRate,
          avgExecutionTime: row.avgExecutionTime,
          status: row.status,
          metrics: { agentId: row.agentId, status: row.status },
        })),
      });
    }

    this.messageBus.publish(
      OperationsIntelligenceEventType.AGENT_UTILIZATION_UPDATED,
      new OperationsIntelligenceEvent(OperationsIntelligenceEventType.AGENT_UTILIZATION_UPDATED, {
        organizationId,
        period,
        metrics,
      }),
    );

    return metrics;
  }

  /**
   * Lists the persisted agent utilization records for the organization.
   */
  async listUtilization(organizationId: string, take = 50) {
    return this.prisma.oiAgentUtilization.findMany({
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
