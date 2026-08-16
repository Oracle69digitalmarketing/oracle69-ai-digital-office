import { Injectable } from "@nestjs/common";
import { DepartmentMemory } from "./department.types.js";

@Injectable()
export class DepartmentMemoryManager {
  private memories = new Map<string, DepartmentMemory>();

  constructor() {}

  getMemory(deptId: string): DepartmentMemory {
    return (
      this.memories.get(deptId) || {
        knowledge: [],
        objectives: [],
        openTasks: [],
        completedWork: [],
      }
    );
  }

  updateMemory(deptId: string, memory: DepartmentMemory): void {
    this.memories.set(deptId, memory);
  }
}
