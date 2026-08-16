import { jest } from "@jest/globals";
import { ZoomConnector } from "../zoom.connector.js";

describe("ZoomConnector", () => {
  let connector: ZoomConnector;

  beforeEach(() => {
    connector = new ZoomConnector();
  });

  it("should have correct metadata", () => {
    expect(connector.metadata.type).toBe("zoom");
    expect(connector.metadata.capabilities).toContain("create_meeting");
    expect(connector.metadata.capabilities).toContain("list_meetings");
    expect(connector.metadata.capabilities).toContain("health_check");
  });

  it("should initialize as disconnected", async () => {
    const health = await connector.health();
    expect(health.status).toBe("disconnected");
  });

  it("should fail execute if not connected", async () => {
    const result = await connector.execute({
      action: "list_meetings",
      params: {},
      organizationId: "test-org",
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Zoom client not initialized");
  });
});
