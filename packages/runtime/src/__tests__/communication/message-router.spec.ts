import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { MessageRouter } from "../../communication/message-router.js";
import { AgentDirectory } from "../../communication/agent-directory.js";
import { MessageType, MessagePriority, MessageStatus } from "../../communication/message.types.js";
import { EventBus } from "../../events/event-bus.js";
import { CommunicationEventType } from "../../communication/communication-events.js";

describe("MessageRouter", () => {
  let router: MessageRouter;
  let directory: AgentDirectory;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    directory = new AgentDirectory();
    router = new MessageRouter(directory, eventBus);
  });

  it("should route message successfully and publish through the canonical EventBus", async () => {
    directory.register({ id: "r1", name: "R1", role: "tester", version: "1.0.0" });
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    const msg = { id: "m1", recipient: "r1", status: MessageStatus.CREATED } as any;

    await router.route(msg);
    expect(msg.status).toBe(MessageStatus.DELIVERED);
    expect(published).toContain(CommunicationEventType.MESSAGE_SENT);
  });
});
