import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AgentDirectory } from '../../communication/agent-directory.js';

describe('AgentDirectory', () => {
  let directory: AgentDirectory;

  beforeEach(() => {
    directory = new AgentDirectory();
  });

  it('should register and lookup an agent', () => {
    const agent = { id: 'a1', name: 'Agent1', role: 'tester', version: '1.0.0' };
    directory.register(agent);
    expect(directory.lookup('a1')).toEqual(agent);
  });

  it('should find by department', () => {
    directory.register({ id: 'a1', name: 'A1', role: 'tester', version: '1.0.0', metadata: { departmentId: 'd1' } });
    directory.register({ id: 'a2', name: 'A2', role: 'tester', version: '1.0.0', metadata: { departmentId: 'd2' } });
    expect(directory.findByDepartment('d1')).toHaveLength(1);
  });
});
