var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let DepartmentRegistry = class DepartmentRegistry {
    departments = new Map();
    registerDepartment(metadata) {
        this.departments.set(metadata.id, metadata);
    }
    unregisterDepartment(id) {
        this.departments.delete(id);
    }
    lookupDepartment(id) {
        return this.departments.get(id);
    }
    listDepartments() {
        return Array.from(this.departments.values());
    }
};
DepartmentRegistry = __decorate([
    Injectable()
], DepartmentRegistry);
export { DepartmentRegistry };
//# sourceMappingURL=department-registry.js.map