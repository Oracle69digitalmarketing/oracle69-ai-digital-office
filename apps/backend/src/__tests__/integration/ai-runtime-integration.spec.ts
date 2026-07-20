import { describe, it, expect, beforeAll } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { ReceptionistService } from "../../receptionist/receptionist.service.js";
import {
  AgentEngineModule,
  AgentRegistry,
  BaseAgent,
  ModelRouter,
  ModelProvider,
  PromptLoader,
} from "@oracle69/agent-engine";
import { MemoryModule, MemoryManager } from "@oracle69/memory";
import { ExecutionEngineModule, ExecutionEngine } from "@oracle69/execution-engine";
import { SharedModule, EventBus, TaskContext } from "@oracle69/shared";

// --- Mocks ---

class MockModelProvider implements ModelProvider {
  name = "mock-provider";
  async generate(prompt: string, tier: string): Promise<{ content: string; usage: any }> {
    console.log(`Mocking model call for tier: ${tier}`);
    if (prompt.includes("# Chief of Staff")) {
      return {
        content: JSON.stringify({
          plan: ["Knowledge Manager", "Marketing"],
          goal: "Hospital Proposal",
        }),
        usage: { total_tokens: 50 },
      };
    }
    if (prompt.includes("# Knowledge Manager")) {
      return {
        content: "Hospital research data: Healthcare standards, regional regulations.",
        usage: { total_tokens: 30 },
      };
    }
    if (prompt.includes("# Marketing Manager")) {
      return {
        content: "Marketing copy for hospital proposal: Trusted, Innovative, Patient-centric.",
        usage: { total_tokens: 40 },
      };
    }
    return { content: "Mock response", usage: { total_tokens: 10 } };
  }
}

class ChiefOfStaffAgent extends BaseAgent {
  constructor(
    metadata: any,
    private executionEngine: ExecutionEngine,
    private registry: AgentRegistry,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
  ) {
    super(metadata);
  }

  async execute(task: TaskContext): Promise<any> {
    this.logger.log("Planning hospital proposal workflow...");
    const prompt = await this.promptLoader.getPrompt(this.metadata.role);
    const planResponse = await this.modelRouter.execute(
      this.metadata.id,
      `${prompt}\nTask: ${task.objective}`,
      {
        taskId: task.taskId,
        taskDescription: task.objective,
        department: "CEO",
        complexity: 9,
      },
    );

    const plan = JSON.parse(planResponse).plan;
    const results = [];

    for (const role of plan) {
      const agents = this.registry.findAgentsByRole(role);
      if (agents.length > 0) {
        const subTask: TaskContext = {
          ...task,
          taskId: `${task.taskId}-${role.toLowerCase().replace(" ", "-")}`,
          objective: `Perform ${role} for ${task.objective}`,
          context: { ...task.context, parentTaskId: task.taskId },
        };
        const res = await this.executionEngine.executeTask(subTask, agents[0]);
        results.push({ role, result: res });
      }
    }

    return `Combined Hospital Proposal: ${results.map((r) => r.result).join(" | ")}`;
  }
}

class DepartmentAgent extends BaseAgent {
  constructor(
    metadata: any,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
  ) {
    super(metadata);
  }

  async execute(task: TaskContext): Promise<any> {
    const prompt = await this.promptLoader.getPrompt(this.metadata.role);
    return await this.modelRouter.execute(this.metadata.id, `${prompt}\nTask: ${task.objective}`, {
      taskId: task.taskId,
      taskDescription: task.objective,
      department: this.metadata.role,
      complexity: 5,
    });
  }
}

// --- Integration Test ---

describe("AI Runtime Integration (Sprint 02.5)", () => {
  let receptionist: ReceptionistService;
  let registry: AgentRegistry;
  let modelRouter: ModelRouter;
  let eventBus: EventBus;
  let memory: MemoryManager;
  let executionEngine: ExecutionEngine;
  let promptLoader: PromptLoader;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharedModule, AgentEngineModule, MemoryModule, ExecutionEngineModule],
      providers: [ReceptionistService],
    }).compile();

    receptionist = module.get<ReceptionistService>(ReceptionistService);
    registry = module.get<AgentRegistry>(AgentRegistry);
    modelRouter = module.get<ModelRouter>(ModelRouter);
    eventBus = module.get<EventBus>(EventBus);
    memory = module.get<MemoryManager>(MemoryManager);
    executionEngine = module.get<ExecutionEngine>(ExecutionEngine);
    promptLoader = module.get<PromptLoader>(PromptLoader);

    // Register Mock Provider
    modelRouter.registerProvider(new MockModelProvider());

    // Register Agents
    const cosMetadata = {
      id: "cos-1",
      name: "Elena",
      role: "Chief of Staff",
      description: "The orchestrator",
      version: "1.0.0",
      capabilities: ["planning", "coordination"],
      permissions: ["all"],
      supportedModels: ["gpt-5.6"] as any,
      healthStatus: "offline" as any,
    };
    const cosAgent = new ChiefOfStaffAgent(
      cosMetadata,
      executionEngine,
      registry,
      modelRouter,
      promptLoader,
    );
    await registry.register(cosAgent);

    const kmMetadata = {
      id: "km-1",
      name: "Kevin",
      role: "Knowledge Manager",
      description: "The researcher",
      version: "1.0.0",
      capabilities: ["research", "data"],
      permissions: ["read"],
      supportedModels: ["mini"] as any,
      healthStatus: "offline" as any,
    };
    const kmAgent = new DepartmentAgent(kmMetadata, modelRouter, promptLoader);
    await registry.register(kmAgent);

    const marketingMetadata = {
      id: "mkt-1",
      name: "Mia",
      role: "Marketing",
      description: "The creative",
      version: "1.0.0",
      capabilities: ["copywriting", "creative"],
      permissions: ["read"],
      supportedModels: ["mini"] as any,
      healthStatus: "offline" as any,
    };
    const marketingAgent = new DepartmentAgent(marketingMetadata, modelRouter, promptLoader);
    await registry.register(marketingAgent);
  });

  it("should complete the Hospital Proposal end-to-end workflow", async () => {
    const events: any[] = [];
    eventBus.allEvents().subscribe((e) => events.push(e));

    const result = await receptionist.handleRequest(
      "user-1",
      "session-1",
      "I need a proposal for a hospital.",
    );

    expect(result.status).toBe("completed");
    expect(result.response).toContain("Hospital research data");
    expect(result.response).toContain("Marketing copy for hospital proposal");

    // Verify Events
    expect(events.some((e) => e.type === "TaskStarted")).toBeTruthy();
    expect(events.some((e) => e.type === "TaskCompleted")).toBeTruthy();

    // Verify Memory
    const sessionContext = await memory.getSessionContext("session-1");
    expect(sessionContext.length).toBeGreaterThanOrEqual(2); // user msg + assistant msg

    // Verify Agent Health
    expect(registry.getAgentHealth("cos-1")).toBe("idle");
    expect(registry.getAgentHealth("km-1")).toBe("idle");
    expect(registry.getAgentHealth("mkt-1")).toBe("idle");

    // Verify Model Router Metrics
    const metrics = modelRouter.getMetrics();
    expect(metrics.length).toBeGreaterThanOrEqual(3); // CoS + KM + Marketing
    expect(metrics.some((m) => m.model.includes("gpt-5.6"))).toBeTruthy(); // CoS
    expect(metrics.some((m) => m.model.includes("mini"))).toBeTruthy(); // KM/MKT
  }, 30000);
});
