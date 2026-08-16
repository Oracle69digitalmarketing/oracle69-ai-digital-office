import { jest } from "@jest/globals";
import { GoogleDriveConnector } from "../google-drive.connector.js";

describe("GoogleDriveConnector", () => {
  let connector: GoogleDriveConnector;

  beforeEach(() => {
    connector = new GoogleDriveConnector();
  });

  it("should have correct metadata", () => {
    expect(connector.metadata.type).toBe("google-drive");
    expect(connector.metadata.capabilities).toContain("upload_file");
    expect(connector.metadata.capabilities).toContain("download_file");
    expect(connector.metadata.capabilities).toContain("search_files");
    expect(connector.metadata.capabilities).toContain("list_folders");
    expect(connector.metadata.capabilities).toContain("create_folder");
    expect(connector.metadata.capabilities).toContain("delete_file");
  });

  it("should initialize as disconnected", async () => {
    const health = await connector.health();
    expect(health.status).toBe("disconnected");
  });

  it("should fail execute if not connected", async () => {
    const result = await connector.execute({
      action: "upload_file",
      params: {},
      organizationId: "test-org",
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Drive client not initialized");
  });
});
