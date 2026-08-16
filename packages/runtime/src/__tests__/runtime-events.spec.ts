import { RuntimeEvent, RuntimeEventType } from "../events/runtime.events.js";

describe("RuntimeEvent", () => {
  it("should create an event with correct type and payload", () => {
    const payload = { foo: "bar" };
    const event = new RuntimeEvent(RuntimeEventType.RUNTIME_READY, payload);

    expect(event.type).toBe(RuntimeEventType.RUNTIME_READY);
    expect(event.payload).toEqual(payload);
    expect(event.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it("should support custom string event types", () => {
    const event = new RuntimeEvent("custom.event");
    expect(event.type).toBe("custom.event");
  });

  it("should attach canonical metadata to every event", () => {
    const event = new RuntimeEvent(RuntimeEventType.RUNTIME_STARTED, {}, { source: "Test" });
    expect(event.eventId).toBeDefined();
    expect(event.source).toBe("Test");
    expect(event.version).toBe("1.0.0");
    expect(event.metadata).toEqual({});
  });

  it("should propagate execution context identifiers from IRuntimeContext", () => {
    const context = {
      traceId: "trace-1",
      orgId: "org-1",
      taskId: "task-1",
    };
    const event = new RuntimeEvent(RuntimeEventType.PLANNING_STARTED, {}, { context });
    expect(event.correlationId).toBe("trace-1");
    expect(event.tenantId).toBe("org-1");
    expect(event.executionId).toBe("task-1");
  });

  it("should allow explicit correlation, causation and idempotency identifiers", () => {
    const event = new RuntimeEvent(
      RuntimeEventType.MISSION_STARTED,
      {},
      {
        correlationId: "corr-1",
        causationId: "cause-1",
        idempotencyKey: "idem-1",
        missionId: "mission-1",
      },
    );
    expect(event.correlationId).toBe("corr-1");
    expect(event.causationId).toBe("cause-1");
    expect(event.idempotencyKey).toBe("idem-1");
    expect(event.missionId).toBe("mission-1");
  });
});
