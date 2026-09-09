import "reflect-metadata";
import { jest, describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { EventBus, AgentMetadata } from "@oracle69/shared";
import { AgentRegistry, BaseAgent } from "@oracle69/agent-engine";
import { MemoryManager, ConversationManager } from "@oracle69/memory";
import { ExecutionEngine } from "@oracle69/execution-engine";
import { TenantContextService, TenantContextError } from "@oracle69/runtime";
import { ReceptionistService } from "../receptionist/receptionist.service.js";

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
    version: "1",
    capabilities: [],
    permissions: [],
    supportedModels: ["nano"],
    healthStatus: "idle",
  } as any;
}

async function registerAgent(
  registry: AgentRegistry,
  agentId: string,
  role: string,
  orgId: string,
  result: string,
) {
  const agent = new StubAgent(makeMetadata(agentId, role), result);
  await registry.register(agent, orgId);
  return agent;
}

let tenantContext: TenantContextService;
let memory: MemoryManager;
let conversation: ConversationManager;
let eventBus: EventBus;
let hits: string[];

function makeService(registry: AgentRegistry) {
  memory = new MemoryManager({} as any);
  conversation = new ConversationManager(memory);
  eventBus = new EventBus();
  const published: any[] = [];
  (eventBus as any).publish = (e: any) => {
    published.push(e);
    return e;
  };
  const executionEngine = {
    executeTask: jest.fn(async (task: any, agent: any) => {
      hits.push(`task`);

      await memory.saveSession(task.sessionId, {
        role: "assistant",
        content: `exec-${agent.metadata.id}`,
      });

      return `exec-${agent.metadata.id}`;
    }),
  } as any;
  return {
    service: new ReceptionistService(
      executionEngine,
      memory,
      conversation,
      registry,
      eventBus as any,
      tenantContext,
    ),
    published,
    memory,
  };
}

describe("Receptionist tenant isolation", () => {
  let registry: AgentRegistry;
  let ctx: { service: ReceptionistService; published: any[]; memory: MemoryManager };

  beforeAll(() => {
    tenantContext = new TenantContextService();
  });

  beforeEach(() => {
    registry = new AgentRegistry();
    hits = [];
  });

  function runForTenant(orgId: string, userId: string, sessionId: string, message: string) {
    return tenantContext.run({ tenantId: orgId }, () =>
      ctx.service.handleRequest(userId, sessionId, message),
    );
  }

  it("A: tenant A can use its own receptionist/session state", async () => {
    await registerAgent(registry, "cos-A", "chief-of-staff", "org-A", "res-A");
    ctx = makeService(registry);
    await runForTenant("org-A", "uA", "s1", "hello");
    expect(hits).toHaveLength(1);
    // The assistant reply was written, and events carry org-A.
    const completed = ctx.published.find(
      (e: any) => e.type === "task.completed",
    );
    expect(completed.payload.organizationId).toBe("org-A");
  });

  it("B: tenant B can use its own receptionist/session state", async () => {
    await registerAgent(registry, "cos-B", "chief-of-staff", "org-B", "res-B");
    ctx = makeService(registry);
    await runForTenant("org-B", "uB", "s1", "hello");
    expect(hits).toHaveLength(1);
    const completed = ctx.published.find((e: any) => e.type === "task.completed");
    expect(completed.payload.organizationId).toBe("org-B");
  });

  it("C: tenant A cannot access tenant B receptionist state (no cos agent, fails)", async () => {
    // Only org-B has a chief-of-staff; org-A must not resolve it.
    await registerAgent(registry, "cos-B", "chief-of-staff", "org-B", "res-B");
    ctx = makeService(registry);
    await expect(runForTenant("org-A", "uA", "s1", "hello")).rejects.toThrow(
      /Chief of Staff not found/,
    );
    expect(hits).toHaveLength(0);
  });

  it("D: tenant B cannot access tenant A receptionist state (no cos agent, fails)", async () => {
    await registerAgent(registry, "cos-A", "chief-of-staff", "org-A", "res-A");
    ctx = makeService(registry);
    await expect(runForTenant("org-B", "uB", "s1", "hello")).rejects.toThrow(
      /Chief of Staff not found/,
    );
    expect(hits).toHaveLength(0);
  });

  it("E: tenant A role lookup cannot return tenant B agents", async () => {
    await registerAgent(registry, "cos-A", "chief-of-staff", "org-A", "res-A");
    await registerAgent(registry, "cos-B", "chief-of-staff", "org-B", "res-B");
    const lookedUp = registry.findAgentsByRoleAndTenant("chief-of-staff", "org-A");
    expect(lookedUp.map((a) => a.metadata.id)).toEqual(["cos-A"]);
  });

  it("F: tenant B role lookup cannot return tenant A agents", async () => {
    await registerAgent(registry, "cos-A", "chief-of-staff", "org-A", "res-A");
    await registerAgent(registry, "cos-B", "chief-of-staff", "org-B", "res-B");
    const lookedUp = registry.findAgentsByRoleAndTenant("chief-of-staff", "org-B");
    expect(lookedUp.map((a) => a.metadata.id)).toEqual(["cos-B"]);
  });

  it("G: missing tenant context fails closed", async () => {
    await registerAgent(registry, "cos-A", "chief-of-staff", "org-A", "res-A");
    ctx = makeService(registry);
    await expect(
      ctx.service.handleRequest("uA", "s1", "hello"),
    ).rejects.toBeInstanceOf(TenantContextError);
    expect(hits).toHaveLength(0);
  });

  it("G2: global/system (tenant-less) agents are never returned for tenant lookup", async () => {
    // A system-global chief-of-staff registered WITHOUT a tenant must not be
    // resolved for any tenant (no system fallback).
    const global = new StubAgent(makeMetadata("global-cos", "chief-of-staff"), "g");
    await registry.register(global);
    const lookedUp = registry.findAgentsByRoleAndTenant("chief-of-staff", "org-A");
    expect(lookedUp).toHaveLength(0);
  });

  it("H: receptionist events/memory retain the correct tenant", async () => {
    await registerAgent(registry, "cos-B", "chief-of-staff", "org-B", "res-B");
    ctx = makeService(registry);
    await runForTenant("org-B", "uB", "mysession", "hello");

    for (const e of ctx.published) {
      if (e.type.startsWith("task.")) {
        expect(e.payload.organizationId).toBe("org-B");
        expect(e.payload.organizationId).not.toBe("system");
      }
    }
    // Session memory must be tenant-scoped (keyed under the tenant prefix).
    const sessionKeys = Array.from((ctx.memory as any).sessionMemory.keys()) as string[];
    expect(sessionKeys.some((k) => k.startsWith("org-B::"))).toBe(true);
  });
});
