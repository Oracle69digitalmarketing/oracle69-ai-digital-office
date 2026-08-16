import { RuntimeEvent } from "../events/runtime.events.js";

export enum DepartmentEventType {
  DEPARTMENT_CREATED = "department.created",
  DEPARTMENT_STARTED = "department.started",
  DEPARTMENT_COMPLETED = "department.completed",
  DEPARTMENT_FAILED = "department.failed",
  MANAGER_ASSIGNED = "manager.assigned",
  MANAGER_APPROVED = "manager.approved",
  MANAGER_REJECTED = "manager.rejected",
  DEPARTMENT_REPORT_GENERATED = "department.report.generated",
  DEPARTMENT_MEMORY_UPDATED = "department.memory.updated",
}

export class DepartmentEvent extends RuntimeEvent {}
