import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { MemoryManager } from "../../memory/memory-manager.js";
import { EventBus } from "../../events/event-bus.js";
import { RuntimeEventType } from "../../events/runtime.events.js";

describe("MemoryManager", () => {
  let manager: MemoryManager;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new MemoryManager(eventBus);
  });

  it("should save and retrieve memory", async () => {
    const record = { id: "m1", type: "working" as any, content: "data", timestamp: "now" };
    await manager.save(record);
    const results = await manager.retrieve("data");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("m1");
  });

  it("should publish memory events through the canonical EventBus", async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await manager.save({ id: "m1", type: "working" as any, content: "data", timestamp: "now" });
    await manager.retrieve("data");

    expect(published).toContain(RuntimeEventType.MEMORY_CREATED);
    expect(published).toContain(RuntimeEventType.MEMORY_RETRIEVED);
  });
});
