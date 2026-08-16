import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { DepartmentRegistry } from "../../departments/department-registry.js";

describe("DepartmentRegistry", () => {
  let registry: DepartmentRegistry;

  beforeEach(() => {
    registry = new DepartmentRegistry();
  });

  it("should register and lookup a department", () => {
    const dept = { id: "d1", name: "Finance", managerId: "m1" };
    registry.registerDepartment(dept);
    expect(registry.lookupDepartment("d1")).toEqual(dept);
  });

  it("should list all departments", () => {
    registry.registerDepartment({ id: "d1", name: "Finance", managerId: "m1" });
    registry.registerDepartment({ id: "d2", name: "HR", managerId: "m2" });
    expect(registry.listDepartments()).toHaveLength(2);
  });
});
