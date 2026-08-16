export interface DepartmentMetadata {
  id: string;
  name: string;
  managerId: string;
}
export interface DepartmentMemory {
  knowledge: any[];
  objectives: any[];
  openTasks: string[];
  completedWork: string[];
}
export interface IDepartmentManager {
  delegateTask(taskId: string, agentId: string): Promise<void>;
  generateReport(): Promise<string>;
}
//# sourceMappingURL=department.types.d.ts.map
