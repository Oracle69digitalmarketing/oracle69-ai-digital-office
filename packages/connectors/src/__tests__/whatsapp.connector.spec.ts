import { jest } from "@jest/globals";
import { WhatsAppBusinessConnector } from "../whatsapp.connector.js";

describe("WhatsAppBusinessConnector", () => {
  let connector: WhatsAppBusinessConnector;

  beforeEach(() => {
    connector = new WhatsAppBusinessConnector();
  });

  it("should have correct metadata", () => {
    expect(connector.metadata.type).toBe("whatsapp");
    expect(connector.metadata.capabilities).toContain("send_text");
    expect(connector.metadata.capabilities).toContain("send_template");
    expect(connector.metadata.capabilities).toContain("health_check");
  });

  it("should initialize as disconnected", async () => {
    const health = await connector.health();
    expect(health.status).toBe("disconnected");
  });

  it("should fail execute if not connected", async () => {
    const result = await connector.execute({
      action: "send_text",
      params: { to: "123456789", text: "Hello" },
      organizationId: "test-org",
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("WhatsApp client not initialized");
  });
});
