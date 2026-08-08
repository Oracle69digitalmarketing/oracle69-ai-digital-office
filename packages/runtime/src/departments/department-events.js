import { RuntimeEvent } from '../events/runtime.events.js';
export var DepartmentEventType;
(function (DepartmentEventType) {
    DepartmentEventType["DEPARTMENT_CREATED"] = "department.created";
    DepartmentEventType["DEPARTMENT_STARTED"] = "department.started";
    DepartmentEventType["DEPARTMENT_COMPLETED"] = "department.completed";
    DepartmentEventType["DEPARTMENT_FAILED"] = "department.failed";
    DepartmentEventType["MANAGER_ASSIGNED"] = "manager.assigned";
    DepartmentEventType["MANAGER_APPROVED"] = "manager.approved";
    DepartmentEventType["MANAGER_REJECTED"] = "manager.rejected";
    DepartmentEventType["DEPARTMENT_REPORT_GENERATED"] = "department.report.generated";
    DepartmentEventType["DEPARTMENT_MEMORY_UPDATED"] = "department.memory.updated";
})(DepartmentEventType || (DepartmentEventType = {}));
export class DepartmentEvent extends RuntimeEvent {
}
//# sourceMappingURL=department-events.js.map