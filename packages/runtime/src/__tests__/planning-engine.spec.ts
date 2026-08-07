import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PlanningEngine } from '../planner/planning-engine.js';
import { AgentRegistry } from '../agent-registry.js';
import { RuntimeContext } from '../runtime-context.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('PlanningEngine', () => {
  let engine: PlanningEngine;
  let registry: AgentRegistry;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    registry = new AgentRegistry(eventEmitter);
    engine = new PlanningEngine(registry, eventEmitter);
  });

  it('should generate a plan based on goal', async () => {
    registry.register({ id: 'km-1', name: 'KM', role: 'knowledge-manager', version: '1.0.0', capabilities: ['research'] });
    registry.register({ id: 'pm-1', name: 'PM', role: 'project-manager', version: '1.0.0', capabilities: ['writing'] });
    registry.register({ id: 'cos-1', name: 'CoS', role: 'chief-of-staff', version: '1.0.0' });

    const context = new RuntimeContext('t1', 'o1');
    const plan = await engine.generatePlan('Generate a quarterly report', context);

    expect(plan.goal).toBe('Generate a quarterly report');
    expect(plan.tasks.size).toBe(3);
    expect(plan.tasks.get('research-task')?.agentId).toBe('km-1');
    expect(plan.tasks.get('draft-task')?.agentId).toBe('pm-1');
    expect(plan.tasks.get('approval-task')?.agentId).toBe('cos-1');
  });

  it('should detect circular dependencies', async () => {
    const context = new RuntimeContext('t1', 'o1');
    const tasks = [
        { id: 't1', type: 'sequential' as any, objective: 'o1', role: 'r1', dependencies: ['t2'] },
        { id: 't2', type: 'sequential' as any, objective: 'o2', role: 'r1', dependencies: ['t1'] }
    ];
    
    // @ts-ignore
    const validation = await engine.validatePlan({ tasks: new Map(tasks.map(t => [t.id, t])) } as any);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Circular dependency detected in task graph.');
  });

  it('should fail if no agent is found for a task', async () => {
    const context = new RuntimeContext('t1', 'o1');
    
    await expect(engine.generatePlan('Do something', context)).rejects.toThrow('Plan validation failed');
  });

  it('should filter agents by capabilities', async () => {
    registry.register({ id: 'rec-1', name: 'R1', role: 'receptionist', version: '1.0.0' });
    registry.register({ 
        id: 'agent-1', name: 'A1', role: 'tester', version: '1.0.0', 
        capabilities: ['research'] 
    });
    registry.register({ 
        id: 'agent-2', name: 'A2', role: 'tester', version: '1.0.0', 
        capabilities: ['writing'] 
    });

    const context = new RuntimeContext('t1', 'o1');
    
    // Manually force an agent selection check
    const task = { id: 't1', role: 'tester', objective: 'do research', dependencies: [], requiredCapabilities: ['research'] } as any;
    // @ts-ignore
    engine.selectAgent(task);
    expect(task.agentId).toBe('agent-1');
  });
});
