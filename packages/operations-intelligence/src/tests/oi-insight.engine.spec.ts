import { jest } from "@jest/globals";
import { OiInsightEngine } from "../services/oi-insight.engine.js";
import { OperationsIntelligenceEventType } from "../events/oi.events.js";

describe("OiInsightEngine", () => {
  let engine: OiInsightEngine;
  let modelProvider: any;
  let operationsEngine: any;
  let workflowEngine: any;
  let agentEngine: any;
  let messageBus: any;
  let memory: any;
  let prisma: any;

  const operations = {
    period: "Q3 2026",
    tasksTotal: 10,
    tasksCompleted: 4,
    completionRate: 0.4,
    cycleTimeAvg: 5,
    throughput: 4,
    backlog: 6,
    avgExecutionTime: 25,
    metrics: { statusBreakdown: { completed: 4, pending: 6 }, avgTaskCost: 100, activeAgents: 2 },
  };
  const workflows = {
    period: "Q3 2026",
    workflowsTotal: 5,
    workflowsCompleted: 2,
    successRate: 0.4,
    avgStages: 1.5,
    stalledWorkflows: 1,
    metrics: { statusBreakdown: {}, stepsTotal: 8, failedWorkflows: 1, inFlightWorkflows: 2 },
  };
  const agents = {
    period: "Q3 2026",
    agents: [
      {
        agentId: "agent-1",
        agentName: "A",
        tasksAssigned: 3,
        tasksCompleted: 1,
        completionRate: 0.33,
        utilizationRate: 0.67,
        avgExecutionTime: 20,
        status: "active",
      },
      {
        agentId: "agent-2",
        agentName: "B",
        tasksAssigned: 2,
        tasksCompleted: 0,
        completionRate: 0,
        utilizationRate: 0,
        avgExecutionTime: null,
        status: "idle",
      },
    ],
    utilizationAvg: 0.3333,
    completionAvg: 0.1667,
    idleAgents: 0,
    metrics: { totalAgents: 2, busyAgents: 1, healthyAgents: 2, unhealthyAgents: 0 },
  };

  beforeEach(() => {
    modelProvider = { analyze: jest.fn() };
    operationsEngine = { compute: jest.fn().mockResolvedValue(operations) };
    workflowEngine = { compute: jest.fn().mockResolvedValue(workflows) };
    agentEngine = { compute: jest.fn().mockResolvedValue(agents) };
    messageBus = { publish: jest.fn() };
    memory = { save: jest.fn().mockResolvedValue(undefined) };

    engine = new OiInsightEngine(
      modelProvider,
      operationsEngine,
      workflowEngine,
      agentEngine,
      messageBus,
      memory,
    );
    prisma = (engine as any).prisma;
    prisma.oiOpsInsight.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.oiOpsRecommendation.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.oiOpsInsight.findMany = jest.fn().mockResolvedValue([]);
    prisma.oiOpsRecommendation.findMany = jest.fn().mockResolvedValue([]);
  });

  it("should generate AI operational insights, persist them, save memory and publish events", async () => {
    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({
        insights: [
          { type: "tasks", content: "Backlog is growing faster than completion.", confidence: 0.9 },
        ],
        recommendations: [
          {
            title: "Rebalance backlog",
            priority: "high",
            action: "Dispatch oldest tasks.",
            expectedImpact: "Faster cycle time",
          },
        ],
      }),
    });

    const result = await engine.generateInsights("org-1");

    expect(result.source).toBe("ai");
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].source).toBe("ai");
    expect(result.recommendations[0].priority).toBe("high");

    expect(prisma.oiOpsInsight.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ organizationId: "org-1", source: "ai" }),
      ]),
    });
    expect(prisma.oiOpsRecommendation.createMany).toHaveBeenCalled();
    expect(memory.save).toHaveBeenCalledWith(expect.objectContaining({ type: "business" }));
    expect(messageBus.publish).toHaveBeenCalledWith(
      OperationsIntelligenceEventType.INSIGHT_GENERATED,
      expect.objectContaining({ type: OperationsIntelligenceEventType.INSIGHT_GENERATED }),
    );
    expect(messageBus.publish).toHaveBeenCalledWith(
      OperationsIntelligenceEventType.RECOMMENDATION_GENERATED,
      expect.objectContaining({ type: OperationsIntelligenceEventType.RECOMMENDATION_GENERATED }),
    );
  });

  it("should fall back to deterministic insights when the model call fails", async () => {
    modelProvider.analyze.mockRejectedValue(new Error("provider unavailable"));

    const result = await engine.generateInsights("org-1");

    expect(result.source).toBe("deterministic");
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.every((i: any) => i.source === "deterministic")).toBe(true);
    expect(result.recommendations.some((r: any) => r.priority === "high")).toBe(true);
    expect(prisma.oiOpsInsight.createMany).toHaveBeenCalled();
    expect(memory.save).toHaveBeenCalled();
  });

  it("should fall back to deterministic insights when the model returns invalid JSON", async () => {
    modelProvider.analyze.mockResolvedValue({ content: "not json at all" });

    const result = await engine.generateInsights("org-1");

    expect(result.source).toBe("deterministic");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should fall back when the model returns empty arrays", async () => {
    modelProvider.analyze.mockResolvedValue({
      content: JSON.stringify({ insights: [], recommendations: [] }),
    });

    const result = await engine.generateInsights("org-1");

    expect(result.source).toBe("deterministic");
  });

  it("should produce a neutral deterministic result when operations are healthy", async () => {
    modelProvider.analyze.mockRejectedValue(new Error("provider unavailable"));
    operationsEngine.compute.mockResolvedValue({
      ...operations,
      tasksTotal: 10,
      tasksCompleted: 10,
      completionRate: 1,
      backlog: 0,
    });
    workflowEngine.compute.mockResolvedValue({
      ...workflows,
      workflowsTotal: 5,
      workflowsCompleted: 5,
      successRate: 1,
      stalledWorkflows: 0,
    });
    agentEngine.compute.mockResolvedValue({
      ...agents,
      agents: [
        {
          agentId: "agent-1",
          agentName: "A",
          tasksAssigned: 3,
          tasksCompleted: 3,
          completionRate: 1,
          utilizationRate: 1,
          avgExecutionTime: 20,
          status: "active",
        },
      ],
    });

    const result = await engine.generateInsights("org-1");

    expect(result.source).toBe("deterministic");
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].type).toBe("efficiency");
  });

  it("should propagate errors from the underlying compute engines", async () => {
    operationsEngine.compute.mockRejectedValue(new Error("Organization not found"));

    await expect(engine.generateInsights("missing-org")).rejects.toThrow("Organization not found");
    expect(prisma.oiOpsInsight.createMany).not.toHaveBeenCalled();
  });

  it("should list persisted insights and recommendations", async () => {
    prisma.oiOpsInsight.findMany = jest.fn().mockResolvedValue([{ id: "i1" }]);
    prisma.oiOpsRecommendation.findMany = jest.fn().mockResolvedValue([{ id: "r1" }]);

    await expect(engine.listInsights("org-1")).resolves.toHaveLength(1);
    await expect(engine.listRecommendations("org-1")).resolves.toHaveLength(1);
  });
});
