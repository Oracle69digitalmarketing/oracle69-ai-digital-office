import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { MissionManager } from "../../missions/mission-manager.js";
import { MissionRegistry } from "../../missions/mission-registry.js";
import { MissionStatus, Mission } from "../../missions/mission.types.js";
import { EventBus } from "../../events/event-bus.js";
import { RuntimeEventType } from "../../events/runtime.events.js";
import {
  InMemoryMissionRepository,
  MissionConflictError,
} from "../../persistence/mission.repository.js";
import { TenantContextService, TenantContextError } from "../../tenancy/tenant-context.js";

const mission = (overrides: Partial<Mission> = {}): Mission => ({
  id: "m1",
  goal: "Test mission",
  priority: "normal",
  deadline: "2026-12-31T00:00:00.000Z",
  owner: "ceo",
  status: MissionStatus.DRAFT,
  tenantId: "org-1",
  ...overrides,
});

describe("MissionManager", () => {
  let manager: MissionManager;
  let registry: MissionRegistry;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    registry = new MissionRegistry(new InMemoryMissionRepository());
    manager = new MissionManager(registry, eventBus);
  });

  it("should create and start a mission", async () => {
    await manager.createMission(mission());
    const started = await manager.startMission("m1");
    expect(started.status).toBe(MissionStatus.RUNNING);
    const stored = await registry.getMission("m1");
    expect(stored?.status).toBe(MissionStatus.RUNNING);
  });

  it("should publish tenant-aware mission events through the canonical EventBus", async () => {
    const published: Array<{ type: string; tenantId?: string; missionId?: string }> = [];
    eventBus
      .allEvents()
      .subscribe((event) =>
        published.push({ type: event.type, tenantId: event.tenantId, missionId: event.missionId }),
      );

    await manager.createMission(mission({ executionId: "exec-1", correlationId: "corr-1" }));
    await manager.startMission("m1");

    expect(published).toContainEqual(
      expect.objectContaining({ type: RuntimeEventType.MISSION_CREATED }),
    );
    expect(published).toContainEqual(
      expect.objectContaining({ type: RuntimeEventType.MISSION_STARTED }),
    );
    for (const event of published) {
      expect(event.tenantId).toBe("org-1");
      expect(event.missionId).toBe("m1");
    }
  });

  it("should persist missions durably through the repository", async () => {
    const repository = new InMemoryMissionRepository();
    const localManager = new MissionManager(new MissionRegistry(repository), eventBus);

    await localManager.createMission(mission({ id: "m-durable" }));
    await localManager.startMission("m-durable");

    const reloaded = await repository.findById("m-durable");
    expect(reloaded?.status).toBe(MissionStatus.RUNNING);
    expect(reloaded?.tenantId).toBe("org-1");
  });

  it("should prevent duplicate mission creation within a tenant", async () => {
    await manager.createMission(mission({ missionKey: "ops-recovery" }));
    await expect(
      manager.createMission(mission({ id: "m2", missionKey: "ops-recovery" })),
    ).rejects.toThrow(MissionConflictError);
  });

  it("should isolate missions between tenants", async () => {
    await manager.createMission(mission({ id: "m-tenant-a", tenantId: "org-a" }));
    await manager.createMission(mission({ id: "m-tenant-b", tenantId: "org-b" }));

    const missionsA = await manager.listMissions("org-a");
    expect(missionsA.map((m) => m.id)).toEqual(["m-tenant-a"]);
  });

  it("should enforce tenant scope when no tenant is resolvable", async () => {
    const tenantContext = new TenantContextService();
    const strictManager = new MissionManager(registry, eventBus, tenantContext);

    await expect(strictManager.createMission(mission({ tenantId: "" as string }))).rejects.toThrow(
      TenantContextError,
    );
  });

  it("should recover interrupted missions after a restart", async () => {
    await manager.createMission(mission({ id: "m-running", status: MissionStatus.RUNNING }));
    await manager.createMission(mission({ id: "m-completed", status: MissionStatus.COMPLETED }));

    const recovered = await manager.recoverInterrupted("org-1");

    expect(recovered.map((m) => m.id)).toEqual(["m-running"]);
    expect(recovered[0].status).toBe(MissionStatus.RECOVERED);
    const stored = await registry.getMission("m-running");
    expect(stored?.status).toBe(MissionStatus.RECOVERED);
  });

  it("should publish MISSION_RECOVERED events during recovery", async () => {
    const published: string[] = [];
    eventBus.allEvents().subscribe((event) => published.push(event.type));

    await manager.createMission(mission({ id: "m-running", status: MissionStatus.RUNNING }));
    await manager.recoverInterrupted("org-1");

    expect(published).toContain(RuntimeEventType.MISSION_RECOVERED);
  });

  it("should cancel and fail missions through the durable registry", async () => {
    await manager.createMission(mission());
    const cancelled = await manager.cancelMission("m1");
    expect(cancelled.status).toBe(MissionStatus.CANCELLED);

    await manager.createMission(mission({ id: "m2" }));
    const failed = await manager.failMission("m2", "boom");
    expect(failed.status).toBe(MissionStatus.FAILED);
    expect(failed.error).toBe("boom");
  });
});
