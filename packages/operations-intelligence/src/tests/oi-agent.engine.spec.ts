import { jest } from "@jest/globals";
import { OiAgentEngine } from "../services/oi-agent.engine.js";
import { OperationsIntelligenceEventType } from "../events/oi.events.js";

describe("OiAgentEngine", () => {
  let engine: OiAgentEngine;
  let messageBus: any;
  let prisma: any;

  const agentFixture = (overrides: any = {}, tasks: any[] = []) => ({
    id: "agent-1",
    name: "Operations Manager",
    status: "active",
    health: "healthy",
    tasks,
    ...overrides,
  });

  beforeEach(() => {
    messageBus = { publish: jest.fn() };
    engine = new OiAgentEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.organization.findUnique = jest.fn().mockResolvedValue({ id: "org-1" });
    prisma.agent.findMany = jest.fn().mockResolvedValue([]);
    prisma.oiAgentUtilization.createMany = jest.fn().mockResolvedValue({ count: 0 });
    prisma.oiAgentUtilization.findMany = jest.fn().mockResolvedValue([]);
  });

  it("should compute agent utilization and persist records", async () => {
    prisma.agent.findMany = jest.fn().mockResolvedValue([
      agentFixture({}, [
        { status: "completed", executionTime: 30 },
        { status: "in_progress", executionTime: 10 },
        { status: "pending", executionTime: null },
      ]),
      agentFixture(
        { id: "agent-2", name: "Finance Manager", status: "idle", health: "healthy" },
        [],
      ),
    ]);

    const result = await engine.generateUtilization("org-1", "Q3 2026");

    expect(result.metrics.totalAgents).toBe(2);
    expect(result.agents).toHaveLength(2);

    const first = result.agents[0];
    expect(first.tasksAssigned).toBe(3);
    expect(first.tasksCompleted).toBe(1);
    expect(first.completionRate).toBeCloseTo(0.3333, 4);
    expect(first.utilizationRate).toBeCloseTo(0.6667, 4);
    expect(first.avgExecutionTime).toBe(20);

    const second = result.agents[1];
    expect(second.tasksAssigned).toBe(0);
    expect(second.utilizationRate).toBe(0);
    expect(second.completionRate).toBe(0);
    expect(second.avgExecutionTime).toBeNull();

    expect(result.idleAgents).toBe(1);
    expect(result.metrics.busyAgents).toBe(1);
    expect(result.metrics.healthyAgents).toBe(2);

    expect(prisma.oiAgentUtilization.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ organizationId: "org-1", period: "Q3 2026", agentId: "agent-1" }),
      ]),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      OperationsIntelligenceEventType.AGENT_UTILIZATION_UPDATED,
      expect.objectContaining({ type: OperationsIntelligenceEventType.AGENT_UTILIZATION_UPDATED }),
    );
  });

  it("should return empty agent rows when there are no agents", async () => {
    const result = await engine.compute("org-1");

    expect(result.agents).toHaveLength(0);
    expect(result.utilizationAvg).toBe(0);
    expect(result.completionAvg).toBe(0);
    expect(result.idleAgents).toBe(0);
    expect(prisma.oiAgentUtilization.createMany).not.toHaveBeenCalled();
  });

  it("should throw when the organization does not exist", async () => {
    prisma.organization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.generateUtilization("missing-org")).rejects.toThrow(
      "Organization not found",
    );
    expect(prisma.oiAgentUtilization.createMany).not.toHaveBeenCalled();
  });

  it("should list persisted agent utilization records", async () => {
    prisma.oiAgentUtilization.findMany = jest.fn().mockResolvedValue([{ id: "u1" }]);

    await expect(engine.listUtilization("org-1")).resolves.toHaveLength(1);
  });
});
