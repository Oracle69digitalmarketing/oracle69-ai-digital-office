import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MissionEngine } from '../../missions/mission-engine.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MissionManager } from '../../missions/mission-manager.js';
import { PlanningEngine } from '../../planner/planning-engine.js';
import { WorkflowEngine } from '../../workflow/workflow-engine.js';
import { MissionRegistry } from '../../missions/mission-registry.js';
import { AgentRegistry } from '../../agent-registry.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager } from '../../workflow/workflow-managers.js';

describe('MissionEngine', () => {
  let engine: MissionEngine;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    const registry = new AgentRegistry(eventEmitter);
    const missionRegistry = new MissionRegistry();
    engine = new MissionEngine(
        new MissionManager(missionRegistry, eventEmitter),
        new PlanningEngine(registry, eventEmitter),
        new WorkflowEngine(eventEmitter, new CheckpointManager(eventEmitter), new RetryManager(), new CompensationManager(), new ApprovalManager()),
        eventEmitter
    );
  });

  it('should initialize mission', async () => {
    await expect(engine.initializeMission('m1')).resolves.not.toThrow();
  });
});
