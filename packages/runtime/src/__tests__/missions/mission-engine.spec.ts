import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MissionEngine } from '../../missions/mission-engine.js';
import { EventBus } from '../../events/event-bus.js';
import { MissionManager } from '../../missions/mission-manager.js';
import { PlanningEngine } from '../../planner/planning-engine.js';
import { WorkflowEngine } from '../../workflow/workflow-engine.js';
import { MissionRegistry } from '../../missions/mission-registry.js';
import { AgentRegistry } from '../../agent-registry.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager } from '../../workflow/workflow-managers.js';
import { TenantContextService } from '../../tenancy/tenant-context.js';
import { InMemoryMissionRepository } from '../../persistence/mission.repository.js';

describe('MissionEngine', () => {
  let engine: MissionEngine;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    const registry = new AgentRegistry(eventBus);
    const missionRegistry = new MissionRegistry(new InMemoryMissionRepository());
    engine = new MissionEngine(
        new MissionManager(missionRegistry, eventBus),
        new PlanningEngine(registry, eventBus),
        new WorkflowEngine(eventBus, new CheckpointManager(), new RetryManager(), new CompensationManager(), new ApprovalManager()),
        new TenantContextService()
    );
  });

  it('should initialize mission', async () => {
    await expect(engine.initializeMission('m1')).resolves.not.toThrow();
  });

  it('should initialize mission within the tenant scope when provided', async () => {
    const tenantContext = new TenantContextService();
    const registry = new AgentRegistry(eventBus);
    const missionRegistry = new MissionRegistry(new InMemoryMissionRepository());
    const scopedEngine = new MissionEngine(
      new MissionManager(missionRegistry, eventBus),
      new PlanningEngine(registry, eventBus),
      new WorkflowEngine(eventBus, new CheckpointManager(), new RetryManager(), new CompensationManager(), new ApprovalManager()),
      tenantContext
    );

    let activeTenant: string | undefined;
    await tenantContext.run({ tenantId: 'org-1', missionId: 'm1' }, async () => {
      await scopedEngine.initializeMission('m1');
      activeTenant = tenantContext.getTenantId();
    });

    expect(activeTenant).toBe('org-1');
  });
});
