import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { PgVectorAdapter } from "../pgvector-adapter.js";
import { MemoryManager } from "../memory-manager.js";

describe("Tenant isolation for semantic retrieval", () => {
  describe("PgVectorAdapter.similaritySearch", () => {
    let adapter: PgVectorAdapter;
    let prismaMock: any;
    let embedMock: any;

    beforeEach(() => {
      prismaMock = { $queryRaw: jest.fn() as any };
      embedMock = jest.fn() as any;
      adapter = new PgVectorAdapter(prismaMock, { embed: embedMock });
    });

    it("returns empty results when organizationId is omitted (fail-closed)", async () => {
      const results = await adapter.similaritySearch([0.1, 0.2], 5);

      expect(results).toEqual([]);
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it("returns empty results when organizationId is undefined (fail-closed)", async () => {
      const results = await adapter.similaritySearch([0.1, 0.2], 5, undefined);

      expect(results).toEqual([]);
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it("passes organizationId as WHERE filter to the SQL query", async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        { id: "rec-1", content: "test", metadata: {}, timestamp: new Date() },
      ]);

      const results = await adapter.similaritySearch([0.1, 0.2], 5, "org-tenant-a");

      expect(results).toHaveLength(1);
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);

      const queryParts = prismaMock.$queryRaw.mock.calls[0][0];
      const sql = queryParts.join("?");
      expect(sql).toContain('"organizationId"');
    });

    it("does not return records from a different tenant", async () => {
      let capturedQueryParts: any;
      prismaMock.$queryRaw.mockImplementation((...args: any[]) => {
        capturedQueryParts = args[0];
        return Promise.resolve([
          { id: "rec-1", content: "org-a secret", metadata: {}, timestamp: new Date() },
        ]);
      });

      await adapter.similaritySearch([0.1, 0.2], 5, "org-tenant-a");

      const sql = capturedQueryParts.join("?");
      expect(sql).toContain('"organizationId"');
      expect(sql).not.toContain("org-tenant-b");
    });
  });

  describe("MemoryManager.searchSemantic", () => {
    let manager: MemoryManager;
    let mockAdapter: any;

    beforeEach(() => {
      mockAdapter = {
        embed: jest.fn() as any,
        similaritySearch: jest.fn() as any,
        upsert: jest.fn() as any,
      };
      manager = new MemoryManager();
      manager.setVectorAdapter(mockAdapter);
    });

    it("forwards organizationId to vectorAdapter.similaritySearch", async () => {
      await manager.searchSemantic("test query", 5, "org-123");

      expect(mockAdapter.similaritySearch).toHaveBeenCalledWith(
        [0.1, 0.2],
        5,
        "org-123",
      );
    });

    it("does not default to a fallback tenant when organizationId is omitted", async () => {
      await manager.searchSemantic("test query", 5);

      expect(mockAdapter.similaritySearch).toHaveBeenCalledWith(
        [0.1, 0.2],
        5,
        undefined,
      );
    });

    it("returns empty when adapter returns empty (fail-closed)", async () => {
      const results = await manager.searchSemantic("test query", 5, "org-123");

      expect(results).toEqual([]);
    });
  });
});
