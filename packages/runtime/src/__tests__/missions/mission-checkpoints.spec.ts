import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { MissionCheckpoints } from "../../missions/mission-checkpoints.js";
import { EventBus } from "../../events/event-bus.js";
import { RuntimeEventType } from "../../events/runtime.events.js";

describe("MissionCheckpoints", () => {
  let checkpoints: MissionCheckpoints;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    checkpoints = new MissionCheckpoints(eventBus);
  });

  it("should save checkpoint and publish through the canonical EventBus", async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await checkpoints.saveCheckpoint("m1", "state");

    expect(published).toContain(RuntimeEventType.CHECKPOINT_CREATED);
  });

  it("should restore checkpoint and publish through the canonical EventBus", async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await checkpoints.restoreCheckpoint("m1");

    expect(published).toContain(RuntimeEventType.CHECKPOINT_RESTORED);
  });
});
