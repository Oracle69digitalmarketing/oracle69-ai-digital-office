import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { PrismaMemoryPersistence } from "../prisma-memory-persistence.js";
import { MemoryRecord } from "@oracle69/shared";

describe("PrismaMemoryPersistence", () => {
  let persistence: PrismaMemoryPersistence;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      longTermMemoryRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    persistence = new PrismaMemoryPersistence(prismaMock as any);
  });

  it("should save a memory record", async () => {
    const record: MemoryRecord = {
      id: "test-id",
      type: "session",
      sessionId: "session-123",
      content: { text: "hello world" },
      metadata: { organizationId: "org-1" },
      timestamp: new Date(),
    };

    prismaMock.longTermMemoryRecord.create.mockResolvedValue({ id: "saved-id-123" });

    const result = await persistence.save(record);

    expect(result).toBe("saved-id-123");
    expect(prismaMock.longTermMemoryRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "session",
        sessionId: "session-123",
        organizationId: "org-1",
      }),
    });
  });

  it("should search memory records", async () => {
    const mockResults = [
      {
        id: "1",
        type: "session",
        sessionId: "s1",
        content: '{"text":"result"}',
        metadata: {},
        timestamp: new Date(),
        organizationId: "org-1",
      },
    ];
    prismaMock.longTermMemoryRecord.findMany.mockResolvedValue(mockResults);

    const results = await persistence.search("query", 5);

    expect(prismaMock.longTermMemoryRecord.findMany).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });
});
