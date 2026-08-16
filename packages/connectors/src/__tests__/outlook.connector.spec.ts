import { jest } from "@jest/globals";
import { OutlookConnector } from "../outlook.connector.js";

describe("OutlookConnector", () => {
  let connector: OutlookConnector;

  beforeEach(() => {
    connector = new OutlookConnector();
  });

  it("should have correct metadata", () => {
    expect(connector.metadata.type).toBe("outlook");
    expect(connector.metadata.capabilities).toContain("send_email");
    expect(connector.metadata.capabilities).toContain("read_email");
    expect(connector.metadata.capabilities).toContain("health_check");
  });

  it("should initialize as disconnected", async () => {
    const health = await connector.health();
    expect(health.status).toBe("disconnected");
  });

  it("should fail execute if not connected", async () => {
    const result = await connector.execute({
      action: "send_email",
      params: { message: { subject: "Test" } },
      organizationId: "test-org",
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Outlook client not initialized");
  });
});
