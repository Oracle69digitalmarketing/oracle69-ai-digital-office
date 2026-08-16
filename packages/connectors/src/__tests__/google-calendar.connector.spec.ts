import { jest } from "@jest/globals";
import { GoogleCalendarConnector } from "../google-calendar.connector.js";

describe("GoogleCalendarConnector", () => {
  let connector: GoogleCalendarConnector;

  beforeEach(() => {
    connector = new GoogleCalendarConnector();
  });

  it("should have correct metadata", () => {
    expect(connector.metadata.type).toBe("google-calendar");
    expect(connector.metadata.capabilities).toContain("create_event");
    expect(connector.metadata.capabilities).toContain("update_event");
    expect(connector.metadata.capabilities).toContain("delete_event");
    expect(connector.metadata.capabilities).toContain("list_events");
    expect(connector.metadata.capabilities).toContain("get_availability");
  });

  it("should initialize as disconnected", async () => {
    const health = await connector.health();
    expect(health.status).toBe("disconnected");
  });

  it("should fail execute if not connected", async () => {
    const result = await connector.execute({
      action: "list_events",
      params: { timeMin: new Date().toISOString() },
      organizationId: "test-org",
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Calendar client not initialized");
  });
});
