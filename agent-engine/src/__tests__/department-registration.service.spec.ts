import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { DepartmentRegistrationService } from "../department-registration.service.js";
import { AgentRegistry } from "../agent-registry.js";
import { ModelRouter } from "../model-router.js";
import { PromptLoader } from "../prompt-loader.js";

describe("DepartmentRegistrationService", () => {
  let service: DepartmentRegistrationService;
  let registry: AgentRegistry;
  let modelRouter: ModelRouter;
  let promptLoader: PromptLoader;
  let knowledgeService: any;

  beforeEach(() => {
    registry = new AgentRegistry();
    modelRouter = {} as any;
    promptLoader = {} as any;
    knowledgeService = {
      getRelevantContext: jest.fn().mockResolvedValue("test knowledge"),
    };
    service = new DepartmentRegistrationService(
      registry,
      modelRouter,
      promptLoader,
      knowledgeService,
    );
  });

  it("should register all 11 departments on initialization", async () => {
    const registerSpy = jest.spyOn(registry, "register");

    await service.onModuleInit();

    expect(registerSpy).toHaveBeenCalledTimes(11);

    const agents = registry.getAllAgents();
    expect(agents).toHaveLength(11);

    const roles = agents.map((a) => a.metadata.role);
    expect(roles).toContain("ceo");
    expect(roles).toContain("chief-of-staff");
    expect(roles).toContain("project-manager");
    expect(roles).toContain("finance");
    expect(roles).toContain("marketing");
    expect(roles).toContain("sales");
    expect(roles).toContain("operations");
    expect(roles).toContain("hr");
    expect(roles).toContain("customer-success");
    expect(roles).toContain("knowledge-manager");
    expect(roles).toContain("receptionist");
  });
});
