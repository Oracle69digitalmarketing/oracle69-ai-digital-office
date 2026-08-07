import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ToolRegistry } from '../../tools/tool-registry.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should resolve existing connector', () => {
    expect(registry.resolveConnector('google-drive')).toBeDefined();
  });

  it('should throw for unknown connector', () => {
    expect(() => registry.resolveConnector('invalid')).toThrow('Connector invalid not found');
  });

  it('should allow tool access', () => {
    expect(registry.validateToolAccess('agent-1', 'tool-1')).toBe(true);
  });
});
