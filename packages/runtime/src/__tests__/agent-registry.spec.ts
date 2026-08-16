import { jest } from "@jest/globals";
import { AgentRegistry } from "../agent-registry.js";
import { RegistryValidationError, RegistryConflictError } from "../errors/runtime.errors.js";
import { EventBus } from "../events/event-bus.js";
import { RuntimeEventType } from "../events/runtime.events.js";

describe("AgentRegistry", () => {
  let registry: AgentRegistry;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    registry = new AgentRegistry(eventBus);
  });

  const validAgent = {
    id: "test-agent",
    name: "Test Agent",
    role: "tester",
    version: "1.0.0",
  };

  it("should register a valid agent", () => {
    registry.register(validAgent);
    expect(registry.getAgent("test-agent")).toEqual(validAgent);
  });

  it("should throw RegistryValidationError if metadata is invalid", () => {
    const invalidAgent = { ...validAgent, version: "invalid-version" } as any;
    expect(() => registry.register(invalidAgent)).toThrow(RegistryValidationError);
  });

  it("should throw RegistryConflictError if ID is already registered", () => {
    registry.register(validAgent);
    expect(() => registry.register(validAgent)).toThrow(RegistryConflictError);
  });

  it("should return null for non-existent agent", () => {
    expect(registry.getAgent("ghost")).toBeNull();
  });

  it("should list agents by role", () => {
    registry.register(validAgent);
    registry.register({ ...validAgent, id: "test-agent-2" });
    registry.register({ ...validAgent, id: "other-agent", role: "other" });

    const testers = registry.listAgentsByRole("tester");
    expect(testers).toHaveLength(2);
    expect(testers.map((a) => a.id)).toContain("test-agent");
    expect(testers.map((a) => a.id)).toContain("test-agent-2");
  });

  it("should validate metadata correctly", () => {
    expect(registry.validate(validAgent)).toBe(true);
    expect(registry.validate({ ...validAgent, id: "" })).toBe(false);
    expect(registry.validate({ ...validAgent, name: "" })).toBe(false);
    expect(registry.validate({ ...validAgent, role: "" })).toBe(false);
    expect(registry.validate({ ...validAgent, version: "1" })).toBe(false); // Simplified semver check requires x.y.z
    expect(registry.validate({ ...validAgent, version: "1.0.0-alpha" })).toBe(true);
  });

  it("should publish events through the canonical EventBus on registration and lookup", () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    registry.register(validAgent);
    expect(published).toContain(RuntimeEventType.AGENT_REGISTERED);

    registry.getAgent("test-agent");
    expect(published).toContain(RuntimeEventType.AGENT_LOOKUP);
    expect(published).toContain(RuntimeEventType.AGENT_LOADED);
  });
});
