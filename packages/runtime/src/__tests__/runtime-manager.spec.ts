import { jest } from "@jest/globals";
import { RuntimeManager } from "../runtime-manager.js";
import { RuntimeState } from "../runtime.types.js";
import { RuntimeEventType } from "../events/runtime.events.js";
import { EventBus } from "../events/event-bus.js";

describe("RuntimeManager", () => {
  let manager: RuntimeManager;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new RuntimeManager(eventBus);
  });

  it("should initialize to READY state", async () => {
    expect(manager.getState()).toBe(RuntimeState.UNINITIALIZED);
    await manager.initialize();
    expect(manager.getState()).toBe(RuntimeState.READY);
  });

  it("should transition through states during initialize", async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await manager.initialize();
    expect(published).toContain(RuntimeEventType.RUNTIME_STARTED);
    expect(published).toContain(RuntimeEventType.RUNTIME_READY);
  });

  it("should shut down correctly", async () => {
    await manager.initialize();
    await manager.shutdown();
    expect(manager.getState()).toBe(RuntimeState.STOPPED);
  });

  it("should create execution context", () => {
    const context = manager.createContext("task-1", "org-1");
    expect(context.taskId).toBe("task-1");
    expect(context.orgId).toBe("org-1");
    expect(context.traceId).toBeDefined();
    expect(context.startTime).toBeDefined();
  });

  it("should provide access to the registry", () => {
    const registry = manager.getRegistry();
    expect(registry).toBeDefined();
  });

  it("should support lifecycle state transition listeners", async () => {
    const callback = jest.fn();
    manager.on(RuntimeState.READY, callback);

    await manager.initialize();
    expect(callback).toHaveBeenCalled();
  });

  it("should publish lifecycle events through the canonical EventBus", async () => {
    const events: { type: string; source: string }[] = [];
    eventBus
      .allEvents()
      .subscribe((event) => events.push({ type: event.type, source: event.source }));

    await manager.initialize();
    await manager.shutdown();

    expect(events.map((e) => e.type)).toContain(RuntimeEventType.RUNTIME_STARTED);
    expect(events.map((e) => e.type)).toContain(RuntimeEventType.RUNTIME_READY);
    expect(events.map((e) => e.type)).toContain(RuntimeEventType.RUNTIME_SHUTDOWN);
    expect(events.every((e) => e.source === "RuntimeManager")).toBe(true);
  });
});
