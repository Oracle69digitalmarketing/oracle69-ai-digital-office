import { Injectable, Logger } from "@nestjs/common";
import { MessageBus, MemoryManager } from "@oracle69/runtime";
import type { AiModelProvider } from "@oracle69/sales-intelligence";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import {
  OperationsIntelligenceEventType,
  OperationsIntelligenceEvent,
} from "../events/oi.events.js";
import { OiOperationsEngine, OperationsMetrics } from "./oi-operations.engine.js";
import { OiWorkflowEngine, WorkflowMetrics } from "./oi-workflow.engine.js";
import { OiAgentEngine, AgentUtilizationMetrics } from "./oi-agent.engine.js";

export interface GeneratedOpsInsight {
  type: string;
  content: string;
  confidence: number;
  source: "ai" | "deterministic";
}

export interface GeneratedOpsRecommendation {
  title: string;
  priority: string;
  action: string;
  expectedImpact: string;
  source: "ai" | "deterministic";
}

export interface OpsInsightResult {
  insights: GeneratedOpsInsight[];
  recommendations: GeneratedOpsRecommendation[];
  source: "ai" | "deterministic";
}

interface RawInsight {
  type?: string;
  content?: string;
  confidence?: number;
}

interface RawRecommendation {
  title?: string;
  priority?: string;
  action?: string;
  expectedImpact?: string;
}

const LOW_COMPLETION_RATE = 0.7;
const LOW_SUCCESS_RATE = 0.7;

/**
 * Generates operational intelligence: insights and recommendations for
 * continuously improving the AI workforce's operational performance.
 *
 * The AI path runs through the existing `AiModelProvider` abstraction; whenever
 * the model call fails, returns malformed output or produces no content, the
 * engine falls back to deterministic, data-derived output built from the
 * operations, workflow and agent utilization metrics. Every item is labelled
 * with its source.
 */
@Injectable()
export class OiInsightEngine {
  private readonly logger = new Logger(OiInsightEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: AiModelProvider,
    private readonly operationsEngine: OiOperationsEngine,
    private readonly workflowEngine: OiWorkflowEngine,
    private readonly agentEngine: OiAgentEngine,
    private readonly messageBus: MessageBus,
    private readonly memory: MemoryManager,
  ) {}

  async generateInsights(organizationId: string, period?: string): Promise<OpsInsightResult> {
    this.logger.log(`Generating operational insights for organization ${organizationId}`);

    const operations = await this.operationsEngine.compute(organizationId, period);
    const workflows = await this.workflowEngine.compute(organizationId, period);
    const agents = await this.agentEngine.compute(organizationId, period);

    const context = { operations, workflows, agents };

    try {
      const aiResult = await this.runAiGeneration(context);
      await this.persistAndPublish(organizationId, aiResult);
      return aiResult;
    } catch (error) {
      this.logger.warn(
        `AI operational insight generation failed for organization ${organizationId}; using deterministic fallback: ${(error as Error).message}`,
      );
      const deterministic = this.buildDeterministicResult(context);
      await this.persistAndPublish(organizationId, deterministic);
      return deterministic;
    }
  }

  async listInsights(organizationId: string, take = 50) {
    return this.prisma.oiOpsInsight.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async listRecommendations(organizationId: string, take = 50) {
    return this.prisma.oiOpsRecommendation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  private async runAiGeneration(context: unknown): Promise<OpsInsightResult> {
    const instruction = `
      Analyze the operational context for this organization from a Chief Operating Officer perspective.
      Focus on the AI workforce: task completion, cycle time, backlog, workflow success and agent utilization.
      Return JSON only: {
        "insights": [ { "type": "tasks|workflows|agents|capacity|efficiency|operational", "content": "string", "confidence": 0.0-1.0 } ],
        "recommendations": [ { "title": "string", "priority": "low|normal|high|critical", "action": "string", "expectedImpact": "string" } ]
      }
    `;

    const response = await this.modelProvider.analyze(context, instruction);
    const parsed = JSON.parse(sanitizeJson(response.content));

    const insights = normalizeInsights(parsed.insights, "ai");
    const recommendations = normalizeRecommendations(parsed.recommendations, "ai");

    if (insights.length === 0 || recommendations.length === 0) {
      throw new Error("AI returned no operational insights or recommendations");
    }

    return { insights, recommendations, source: "ai" };
  }

  private buildDeterministicResult(context: OpsContext): OpsInsightResult {
    const { operations, workflows, agents } = context;

    const insights: GeneratedOpsInsight[] = [];
    const recommendations: GeneratedOpsRecommendation[] = [];

    const completionRate = operations.completionRate;
    const tasksTotal = operations.tasksTotal;

    if (tasksTotal > 0 && completionRate < LOW_COMPLETION_RATE) {
      insights.push({
        type: "tasks",
        content:
          `Task completion rate is ${(completionRate * 100).toFixed(1)}% across ${tasksTotal} task(s), ` +
          `below the ${LOW_COMPLETION_RATE * 100}% operational target, with ${operations.backlog} task(s) in the backlog.`,
        confidence: 0.8,
        source: "deterministic",
      });
    }

    if (tasksTotal > 0 && operations.backlog > operations.tasksCompleted) {
      insights.push({
        type: "capacity",
        content: `The task backlog (${operations.backlog}) exceeds completed work (${operations.tasksCompleted}), indicating a capacity constraint.`,
        confidence: 0.7,
        source: "deterministic",
      });
    }

    if (workflows.workflowsTotal > 0 && workflows.successRate < LOW_SUCCESS_RATE) {
      insights.push({
        type: "workflows",
        content:
          `Workflow success rate is ${(workflows.successRate * 100).toFixed(1)}% across ` +
          `${workflows.workflowsTotal} workflow(s), with ${workflows.stalledWorkflows} stalled workflow(s).`,
        confidence: 0.8,
        source: "deterministic",
      });
    } else if (workflows.stalledWorkflows > 0) {
      insights.push({
        type: "workflows",
        content: `${workflows.stalledWorkflows} workflow(s) have started but not completed within the staleness window and may be blocked.`,
        confidence: 0.7,
        source: "deterministic",
      });
    }

    const underutilized = agents.agents.filter(
      (agent) => agent.tasksAssigned > 0 && agent.utilizationRate === 0,
    );
    if (underutilized.length > 0) {
      insights.push({
        type: "agents",
        content: `${underutilized.length} agent(s) have assigned work that has not been actioned; review their task queues for blockage.`,
        confidence: 0.7,
        source: "deterministic",
      });
    }

    const underperforming = agents.agents.filter(
      (agent) => agent.tasksAssigned > 0 && agent.completionRate < 0.5,
    );
    if (underperforming.length > 0) {
      insights.push({
        type: "agents",
        content: `${underperforming.length} agent(s) are completing less than half of their assigned work and may need reassignment or retry.`,
        confidence: 0.7,
        source: "deterministic",
      });
    }

    if (tasksTotal === 0 && workflows.workflowsTotal === 0) {
      insights.push({
        type: "operational",
        content:
          "No tasks or workflows are currently recorded for the organization; no operational baseline exists yet.",
        confidence: 0.6,
        source: "deterministic",
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: "efficiency",
        content:
          "Operational performance is on track with no material completion, workflow or utilization risks detected.",
        confidence: 0.6,
        source: "deterministic",
      });
    }

    if (tasksTotal > 0 && completionRate < LOW_COMPLETION_RATE) {
      recommendations.push({
        title: "Improve task completion",
        priority: "high",
        action:
          "Review the oldest backlog items, unblock dependencies and rebalance assignments toward available agents.",
        expectedImpact: "Raise the task completion rate toward 70%.",
        source: "deterministic",
      });
    }

    if (workflows.workflowsTotal > 0 && workflows.successRate < LOW_SUCCESS_RATE) {
      recommendations.push({
        title: "Recover failing workflows",
        priority: "high",
        action:
          "Inspect failed and stalled workflows, apply retry or checkpoint recovery, and correct their steps.",
        expectedImpact: "Improve workflow success rate and reduce wasted execution time.",
        source: "deterministic",
      });
    }

    if (underutilized.length > 0) {
      recommendations.push({
        title: "Unblock idle agents",
        priority: "normal",
        action:
          "Diagnose the agents with assigned but unstarted work and re-dispatch or reassign their queues.",
        expectedImpact: "Increase workforce utilization and throughput.",
        source: "deterministic",
      });
    }

    if (underperforming.length > 0) {
      recommendations.push({
        title: "Reassign under-performing agents",
        priority: "normal",
        action:
          "Review agents completing less than half of their workload and reassign tasks to higher-performing employees.",
        expectedImpact: "Balance the workforce and protect completion rates.",
        source: "deterministic",
      });
    }

    if (tasksTotal === 0 && workflows.workflowsTotal === 0) {
      recommendations.push({
        title: "Establish an operational baseline",
        priority: "critical",
        action:
          "Create and dispatch the first projects, tasks and workflows so operational performance can be measured.",
        expectedImpact: "Enable Operational Optimization to act on real data.",
        source: "deterministic",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: "Maintain operational cadence",
        priority: "normal",
        action: "Continue the current workforce plan and review operational KPIs next period.",
        expectedImpact: "Sustain current operational performance.",
        source: "deterministic",
      });
    }

    return { insights, recommendations, source: "deterministic" };
  }

  private async persistAndPublish(organizationId: string, result: OpsInsightResult): Promise<void> {
    await this.prisma.oiOpsInsight.createMany({
      data: result.insights.map((insight) => ({
        organizationId,
        type: insight.type,
        content: insight.content,
        confidence: insight.confidence,
        source: insight.source,
      })),
    });

    await this.prisma.oiOpsRecommendation.createMany({
      data: result.recommendations.map((recommendation) => ({
        organizationId,
        title: recommendation.title,
        priority: recommendation.priority,
        action: recommendation.action,
        expectedImpact: recommendation.expectedImpact,
        source: recommendation.source,
      })),
    });

    await this.memory.save({
      id: uuidv4(),
      type: "business",
      content:
        `Operations intelligence for ${organizationId}: ${result.insights.length} insight(s) and ` +
        `${result.recommendations.length} recommendation(s) generated via ${result.source}.`,
      timestamp: new Date().toISOString(),
      metadata: {
        organizationId,
        source: result.source,
        insightCount: result.insights.length,
        recommendationCount: result.recommendations.length,
      },
    });

    this.messageBus.publish(
      OperationsIntelligenceEventType.INSIGHT_GENERATED,
      new OperationsIntelligenceEvent(OperationsIntelligenceEventType.INSIGHT_GENERATED, {
        organizationId,
        insights: result.insights,
        source: result.source,
      }),
    );

    this.messageBus.publish(
      OperationsIntelligenceEventType.RECOMMENDATION_GENERATED,
      new OperationsIntelligenceEvent(OperationsIntelligenceEventType.RECOMMENDATION_GENERATED, {
        organizationId,
        recommendations: result.recommendations,
        source: result.source,
      }),
    );
  }
}

interface OpsContext {
  operations: OperationsMetrics;
  workflows: WorkflowMetrics;
  agents: AgentUtilizationMetrics;
}

function sanitizeJson(content: string): string {
  return content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function normalizeInsights(
  raw: RawInsight[] | undefined,
  source: "ai" | "deterministic",
): GeneratedOpsInsight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.content === "string" && item.content.trim().length > 0)
    .map((item) => {
      const confidence =
        typeof item.confidence === "number" && item.confidence >= 0 && item.confidence <= 1
          ? item.confidence
          : 0.5;
      return {
        type: typeof item.type === "string" && item.type.length > 0 ? item.type : "operational",
        content: item.content as string,
        confidence,
        source,
      };
    });
}

function normalizeRecommendations(
  raw: RawRecommendation[] | undefined,
  source: "ai" | "deterministic",
): GeneratedOpsRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.action === "string" && item.action.trim().length > 0)
    .map((item) => {
      const priority = normalizePriority(item.priority);
      return {
        title:
          typeof item.title === "string" && item.title.length > 0
            ? item.title
            : "Recommended action",
        priority,
        action: item.action as string,
        expectedImpact:
          typeof item.expectedImpact === "string" && item.expectedImpact.length > 0
            ? item.expectedImpact
            : "Improved operational performance",
        source,
      };
    });
}

function normalizePriority(priority: unknown): string {
  if (priority === "low" || priority === "high" || priority === "critical") return priority;
  return "normal";
}
