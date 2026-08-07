import { jest } from '@jest/globals';
import { AgentRegistry } from '../agent-registry.js';
import { RegistryValidationError, RegistryConflictError } from '../errors/runtime.errors.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    registry = new AgentRegistry(eventEmitter);
  });

  const validAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    role: 'tester',
    version: '1.0.0',
  };

  it('should register a valid agent', () => {
    registry.register(validAgent);
    expect(registry.getAgent('test-agent')).toEqual(validAgent);
  });

  it('should throw RegistryValidationError if metadata is invalid', () => {
    const invalidAgent = { ...validAgent, version: 'invalid-version' } as any;
    expect(() => registry.register(invalidAgent)).toThrow(RegistryValidationError);
  });

  it('should throw RegistryConflictError if ID is already registered', () => {
    registry.register(validAgent);
    expect(() => registry.register(validAgent)).toThrow(RegistryConflictError);
  });

  it('should return null for non-existent agent', () => {
    expect(registry.getAgent('ghost')).toBeNull();
  });

  it('should list agents by role', () => {
    registry.register(validAgent);
    registry.register({ ...validAgent, id: 'test-agent-2' });
    registry.register({ ...validAgent, id: 'other-agent', role: 'other' });

    const testers = registry.listAgentsByRole('tester');
    expect(testers).toHaveLength(2);
    expect(testers.map(a => a.id)).toContain('test-agent');
    expect(testers.map(a => a.id)).toContain('test-agent-2');
  });

  it('should validate metadata correctly', () => {
    expect(registry.validate(validAgent)).toBe(true);
    expect(registry.validate({ ...validAgent, id: '' })).toBe(false);
    expect(registry.validate({ ...validAgent, name: '' })).toBe(false);
    expect(registry.validate({ ...validAgent, role: '' })).toBe(false);
    expect(registry.validate({ ...validAgent, version: '1' })).toBe(false); // Simplified semver check requires x.y.z
    expect(registry.validate({ ...validAgent, version: '1.0.0-alpha' })).toBe(true);
  });

  it('should emit events on registration and lookup', () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    
    registry.register(validAgent);
    expect(emitSpy).toHaveBeenCalledWith('agent.registered', expect.any(Object));

    registry.getAgent('test-agent');
    expect(emitSpy).toHaveBeenCalledWith('agent.lookup', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('agent.loaded', expect.any(Object));
  });
});
