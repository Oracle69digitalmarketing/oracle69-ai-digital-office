import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ExecutiveRegistry } from '../../executive/executive-registry.js';

describe('ExecutiveRegistry', () => {
  let registry: ExecutiveRegistry;

  beforeEach(() => {
    registry = new ExecutiveRegistry();
  });

  it('should register and find executive', () => {
    registry.registerExecutive({ id: 'ceo1', role: 'CEO', departmentId: 'd1' });
    expect(registry.findExecutive('ceo1')).toBeDefined();
  });
});
