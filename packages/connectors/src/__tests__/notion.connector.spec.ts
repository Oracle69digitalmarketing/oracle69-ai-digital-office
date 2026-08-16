import { jest } from "@jest/globals";
import { NotionConnector } from "../notion.connector.js";

describe("NotionConnector", () => {
  let connector: NotionConnector;

  beforeEach(() => {
    connector = new NotionConnector();
  });

  it("should have correct metadata", () => {
    expect(connector.metadata.type).toBe("notion");
    expect(connector.metadata.capabilities).toContain("create_page");
    expect(connector.metadata.capabilities).toContain("search");
    expect(connector.metadata.capabilities).toContain("health_check");
  });

  it("should initialize as disconnected", async () => {
    const health = await connector.health();
    expect(health.status).toBe("disconnected");
  });

  it("should fail execute if not connected", async () => {
    const result = await connector.execute({
      action: "create_page",
      params: { parent: { database_id: "test-db" } },
      organizationId: "test-org",
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Notion client not initialized");
  });
});
