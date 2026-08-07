import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DepartmentMemoryManager } from '../../departments/department-memory.js';

describe('DepartmentMemoryManager', () => {
  let memory: DepartmentMemoryManager;

  beforeEach(() => {
    memory = new DepartmentMemoryManager();
  });

  it('should update and retrieve memory', () => {
    const deptId = 'd1';
    const newMemory = { knowledge: ['k1'], objectives: ['o1'], openTasks: [], completedWork: [] };
    memory.updateMemory(deptId, newMemory);
    expect(memory.getMemory(deptId)).toEqual(newMemory);
  });
});
