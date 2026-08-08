import { DepartmentMetadata } from './department.types.js';
export declare class DepartmentRegistry {
    private departments;
    registerDepartment(metadata: DepartmentMetadata): void;
    unregisterDepartment(id: string): void;
    lookupDepartment(id: string): DepartmentMetadata | undefined;
    listDepartments(): DepartmentMetadata[];
}
//# sourceMappingURL=department-registry.d.ts.map