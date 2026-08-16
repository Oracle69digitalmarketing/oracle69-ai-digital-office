import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { ExecutiveOffice } from "../../executive/executive-office.js";
import { EventBus } from "../../events/event-bus.js";
import { ExecutiveEventType } from "../../executive/executive-events.js";

describe("ExecutiveOffice", () => {
  let office: ExecutiveOffice;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    office = new ExecutiveOffice(eventBus);
  });

  it("should assign enterprise goal and publish a canonical event", async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await office.assignEnterpriseGoal({
      id: "g1",
      goal: "Test goal",
      priority: "high",
      deadline: "2026-12-31",
      status: "created",
    });

    expect(published).toContain(ExecutiveEventType.EXECUTIVE_GOAL_CREATED);
  });
});
