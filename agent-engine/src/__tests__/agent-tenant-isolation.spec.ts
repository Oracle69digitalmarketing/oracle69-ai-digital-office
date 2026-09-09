import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { AgentRegistry } from "../agent-registry.js";
import { BaseAgent } from "../base-agent.js";
import { AgentMetadata, TaskContext } from "@oracle69/shared";
import { ChiefOfStaffAgent } from "../agents/chief-of-staff-agent.js";
import { ProjectManagerAgent } from "../agents/project-manager-agent.js";
import { DepartmentAgent } from "../agents/department-agent.js";

class StubAgent extends BaseAgent {
  constructor(metadata: AgentMetadata, private result: string) {
    super(metadata);
  }
  async execute(): Promise<any> {
    return this.result;
  }
}

function makeMetadata(id: string, role: string): AgentMetadata {
  return {
    id,
    name: id,
    role,
    description: "test",
    version: "1.0.0",
    capabilities: [],
    permissions: [],
    supportedModels: ["nano"],
    healthStatus: "idle",
  } as AgentMetadata;
}

async function registerTenantAgent(
  registry: AgentRegistry,
  id: string,
  role: string,
  orgId: string,
) {
  const agent = new StubAgent(makeMetadata(id, role), `res-${id}`);
  await registry.register(agent, orgId);
  return agent;
}

const noopModelRouter = {
  execute: jest.fn(async () => "strategy output"),
} as any;
const noopPromptLoader = { getPrompt: jest.fn(async () => "# prompt") } as any;
const noopKnowledge = { getRelevantContext: jest.fn(async () => "knowledge") } as any;

function makeTask(organizationId: string): TaskContext {
  return {
    taskId: "t1",
    projectId: "p",
    sessionId: "s",
    organizationId,
    priority: "medium",
    objective: "objective",
    context: {},
  } as TaskContext;
}

describe("Phase 3 P1 WS2 — Agent tenant isolation", () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  it("A. Org-A role lookup resolves only Org-A agents", async () => {
    await registerTenantAgent(registry, "pm-A", "Project Manager", "org-A", "x");
    await registerTenantAgent(registry, "pm-B", "Project Manager", "org-B", "x");
    const got = registry.findAgentsByRoleAndTenant("Project Manager", "org-A");
    expect(got.map((a) => a.metadata.id)).toEqual(["pm-A"]);
  });

  it("B. Org-B role lookup resolves only Org-B agents", async () => {
    await registerTenantAgent(registry, "pm-A", "Project Manager", "org-A", "x");
    await registerTenantAgent(registry, "pm-B", "Project Manager", "org-B", "x");
    const got = registry.findAgentsByRoleAndTenant("Project Manager", "org-B");
    expect(got.map((a) => a.metadata.id)).toEqual(["pm-B"]);
  });

  it("C. Org-A ChiefOfStaff cannot delegate to an Org-B ProjectManager", async () => {
    await registerTenantAgent(registry, "pm-B", "Project Manager", "org-B", "x");
    const executionEngine = { executeTask: jest.fn(async () => "executed") };
    const cos = new ChiefOfStaffAgent(
      makeMetadata("cos-A", "chief-of-staff"),
      executionEngine,
      registry,
      noopModelRouter,
      noopPromptLoader,
      noopKnowledge,
    );
    const result = await cos.execute(makeTask("org-A"));
    // No Org-B PM may be invoked on an Org-A task.
    expect(executionEngine.executeTask).not.toHaveBeenCalled();
    expect(String(result)).toContain("no Project Manager found");
  });

  it("D. ChiefOfStaff delegation fails closed with no tenant context", async () => {
    await registerTenantAgent(registry, "pm-A", "Project Manager", "org-A", "x");
    const executionEngine = { executeTask: jest.fn(async () => "executed") };
    const cos = new ChiefOfStaffAgent(
      makeMetadata("cos-A", "chief-of-staff"),
      executionEngine,
      registry,
      noopModelRouter,
      noopPromptLoader,
      noopKnowledge,
    );
    const taskWithoutOrg = makeTask("org-A");
    delete taskWithoutOrg.organizationId;
    await expect(cos.execute(taskWithoutOrg)).rejects.toThrow(
      /Tenant context is required/,
    );
    expect(executionEngine.executeTask).not.toHaveBeenCalled();
  });

  it("D2. ProjectManager delegation fails closed with no tenant context", async () => {
    await registerTenantAgent(registry, "marketing", "Marketing", "org-A", "x");
    const executionEngine = { executeTask: jest.fn(async () => "executed") };
    const pm = new ProjectManagerAgent(
      makeMetadata("pm-A", "project-manager"),
      executionEngine,
      registry,
      noopModelRouter,
      noopPromptLoader,
      noopKnowledge,
    );
    const taskWithoutOrg = makeTask("org-A");
    delete taskWithoutOrg.organizationId;
    await expect(pm.execute(taskWithoutOrg)).rejects.toThrow(
      /Tenant context is required/,
    );
    expect(executionEngine.executeTask).not.toHaveBeenCalled();
  });

  it("E. Global/system agents are not returned for tenant delegation", async () => {
    const global = new StubAgent(makeMetadata("global-pm", "Project Manager"), "g");
    await registry.register(global);
    await registerTenantAgent(registry, "pm-A", "Project Manager", "org-A", "x");
    const got = registry.findAgentsByRoleAndTenant("Project Manager", "org-A");
    expect(got.map((a) => a.metadata.id)).toEqual(["pm-A"]);
  });

  it("F. Org-A delegation to a tenant-scoped agent executes within the same tenant", async () => {
    await registerTenantAgent(registry, "pm-A", "Project Manager", "org-A", "x");
    const executionEngine = { executeTask: jest.fn(async () => "executed") };
    const cos = new ChiefOfStaffAgent(
      makeMetadata("cos-A", "chief-of-staff"),
      executionEngine,
      registry,
      noopModelRouter,
      noopPromptLoader,
      noopKnowledge,
    );
    const task = makeTask("org-A");
    const result = await cos.execute(task);
    expect(executionEngine.executeTask).toHaveBeenCalledTimes(1);
    // The delegated sub-task retains the Org-A tenant.
    const [subTask] = executionEngine.executeTask.mock.calls[0];
    expect((subTask as TaskContext).organizationId).toBe("org-A");
    expect(String(result)).toBe("executed");
  });
});