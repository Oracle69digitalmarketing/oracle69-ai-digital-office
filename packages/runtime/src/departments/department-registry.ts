import { Injectable } from "@nestjs/common";
import { DepartmentMetadata } from "./department.types.js";

@Injectable()
export class DepartmentRegistry {
  private departments = new Map<string, DepartmentMetadata>();

  registerDepartment(metadata: DepartmentMetadata): void {
    this.departments.set(metadata.id, metadata);
  }

  unregisterDepartment(id: string): void {
    this.departments.delete(id);
  }

  lookupDepartment(id: string): DepartmentMetadata | undefined {
    return this.departments.get(id);
  }

  listDepartments(): DepartmentMetadata[] {
    return Array.from(this.departments.values());
  }
}
