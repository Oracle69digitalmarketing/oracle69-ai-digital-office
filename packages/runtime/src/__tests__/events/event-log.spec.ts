import { jest, describe, it, expect } from "@jest/globals";
import { InMemoryEventLog, PrismaEventLog, EventLogRecord } from "../../events/event-log.js";
import { RuntimeEvent, RuntimeEventType } from "../../events/runtime.events.js";

const makeEvent = (overrides: Partial<RuntimeEvent> = {}): RuntimeEvent =>
  new RuntimeEvent(RuntimeEventType.RUNTIME_READY, { ready: true }, { source: "Test" }) as any;

const formedEvent = (options: Record<string, any> = {}): RuntimeEvent =>
  new RuntimeEvent(
    options.type ?? RuntimeEventType.MISSION_STARTED,
    options.payload ?? { missionId: "m1" },
    options,
  );

describe("InMemoryEventLog", () => {
  it("should persist every canonical event written to it", async () => {
    const log = new InMemoryEventLog();
    const event = formedEvent({ tenantId: "org-1", missionId: "m1", correlationId: "corr-1" });

    await log.write(event);

    const record = await log.findById(event.eventId);
    expect(record).not.toBeNull();
    expect(record?.eventId).toBe(event.eventId);
    expect(record?.tenantId).toBe("org-1");
    expect(record?.missionId).toBe("m1");
    expect(record?.correlationId).toBe("corr-1");
    expect(record?.idempotencyKey).toBeUndefined();
  });

  it("should deduplicate events by idempotency key", async () => {
    const log = new InMemoryEventLog();
    const first = formedEvent({ tenantId: "org-1", idempotencyKey: "idem-1" });
    const second = formedEvent({ tenantId: "org-1", idempotencyKey: "idem-1" });

    await log.write(first);
    await log.write(second);

    expect(await log.count()).toBe(1);
    const byKey = await log.findByIdempotencyKey("idem-1");
    expect(byKey?.eventId).toBe(first.eventId);
  });

  it("should not duplicate events with the same event id", async () => {
    const log = new InMemoryEventLog();
    const event = formedEvent({ tenantId: "org-1" });

    await log.write(event);
    await log.write(event);

    expect(await log.count()).toBe(1);
  });

  it("should support tenant-scoped queries and filters", async () => {
    const log = new InMemoryEventLog();
    await log.write(
      formedEvent({
        type: RuntimeEventType.MISSION_CREATED,
        tenantId: "org-a",
        missionId: "m-a",
        correlationId: "corr-a",
      }),
    );
    await log.write(
      formedEvent({
        type: RuntimeEventType.MISSION_STARTED,
        tenantId: "org-a",
        missionId: "m-a",
        correlationId: "corr-a",
      }),
    );
    await log.write(
      formedEvent({
        type: RuntimeEventType.MISSION_CREATED,
        tenantId: "org-b",
        missionId: "m-b",
        correlationId: "corr-b",
      }),
    );

    const tenantA = await log.findByTenant("org-a");
    expect(tenantA).toHaveLength(2);

    const started = await log.findByTenant("org-a", { type: RuntimeEventType.MISSION_STARTED });
    expect(started).toHaveLength(1);

    const byMission = await log.findByTenant("org-a", { missionId: "m-a" });
    expect(byMission).toHaveLength(2);

    const byExecution = await log.findByTenant("org-a", { executionId: "nonexistent" });
    expect(byExecution).toHaveLength(0);

    expect(await log.count({ tenantId: "org-a" })).toBe(2);
  });

  it("should page results by offset and limit", async () => {
    const log = new InMemoryEventLog();
    for (let i = 0; i < 5; i += 1) {
      await log.write(formedEvent({ type: RuntimeEventType.RUNTIME_READY, tenantId: "org-1" }));
    }

    const page = await log.findByTenant("org-1", { limit: 2, offset: 1 });
    expect(page).toHaveLength(2);
  });
});

describe("PrismaEventLog", () => {
  const prismaMock = (overrides: Record<string, unknown> = {}) => {
    const upsert = jest.fn().mockResolvedValue({});
    const findUnique = jest.fn().mockResolvedValue(null);
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    return {
      runtimeEventLog: {
        upsert,
        findUnique,
        findMany,
        count,
      },
      ...overrides,
    } as any;
  };

  it("should persist events through the runtimeEventLog table with an idempotent upsert", async () => {
    const prisma = prismaMock();
    const log = new PrismaEventLog(prisma);
    const event = formedEvent({ tenantId: "org-1", missionId: "m1", idempotencyKey: "idem-1" });

    await log.write(event);

    expect(prisma.runtimeEventLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: event.eventId },
        create: expect.objectContaining({
          eventId: event.eventId,
          type: event.type,
          tenantId: "org-1",
          missionId: "m1",
          idempotencyKey: "idem-1",
        }),
        update: {},
      }),
    );
  });

  it("should resolve records by id and idempotency key", async () => {
    const row = {
      id: "row-1",
      eventId: "evt-1",
      type: RuntimeEventType.MISSION_CREATED,
      payload: { missionId: "m1" },
      source: "MissionManager",
      version: "1.0.0",
      correlationId: "corr-1",
      causationId: null,
      tenantId: "org-1",
      missionId: "m1",
      executionId: null,
      workflowId: null,
      idempotencyKey: "idem-1",
      metadata: {},
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
    };
    const prisma = prismaMock();
    prisma.runtimeEventLog.findUnique.mockResolvedValue(row);
    const log = new PrismaEventLog(prisma);

    const byId = await log.findById("evt-1");
    expect(byId?.tenantId).toBe("org-1");
    expect(byId?.timestamp).toBe(new Date("2026-01-01T00:00:00.000Z").getTime());

    const byKey = await log.findByIdempotencyKey("idem-1");
    expect(byKey?.eventId).toBe("evt-1");
  });

  it("should enforce tenant scoping when listing events", async () => {
    const prisma = prismaMock();
    prisma.runtimeEventLog.findMany.mockResolvedValue([]);
    const log = new PrismaEventLog(prisma);

    await log.findByTenant("org-1", { type: RuntimeEventType.MISSION_CREATED });

    expect(prisma.runtimeEventLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "org-1",
          type: RuntimeEventType.MISSION_CREATED,
        }),
      }),
    );
  });

  it("should fail fast when PrismaService is unavailable", async () => {
    const log = new PrismaEventLog(undefined);
    await expect(log.write(makeEvent())).rejects.toThrow(/PrismaService is not available/);
  });
});
