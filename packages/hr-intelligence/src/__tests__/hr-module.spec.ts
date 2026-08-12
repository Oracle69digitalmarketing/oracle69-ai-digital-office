import { describe, it, expect, beforeEach } from "@jest/globals";
import { EventCatalogService } from "@oracle69/runtime";
import { HrIntelligenceModule } from "../hr-intelligence.module.js";
import { HrEventType } from "../events/hr.events.js";
import { createHrTestModule, HrTestContext } from "../testing/test-fixture.js";
import { EmployeeStatus, PositionStatus } from "../types.js";

describe("HR Intelligence module (Event Bus integration)", () => {
  let ctx: HrTestContext;

  beforeEach(() => {
    ctx = createHrTestModule();
  });

  it("should register HR domain events in the canonical Event Catalog", () => {
    const catalog = new EventCatalogService();
    new HrIntelligenceModule(catalog);

    expect(catalog.isCanonical(HrEventType.EMPLOYEE_HIRED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.EMPLOYEE_UPDATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.EMPLOYEE_OFFBOARDED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.POSITION_CREATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.POSITION_CLOSED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.CANDIDATE_CREATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.CANDIDATE_STAGE_UPDATED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.CANDIDATE_HIRED)).toBe(true);
    expect(catalog.isCanonical(HrEventType.INSIGHT_GENERATED)).toBe(true);

    const entry = catalog.entry(HrEventType.CANDIDATE_HIRED);
    expect(entry?.description).toContain("hired");
    expect(catalog.entry(HrEventType.EMPLOYEE_HIRED)?.category).toBe("executive");
  });

  it("should publish canonical HR events through the shared EventBus", async () => {
    const orgId = "org-module-1";
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const employee = await ctx.employeeService.hireEmployee({
        fullName: "Jane Doe",
        email: "jane@example.com",
        department: "Engineering",
        title: "Software Engineer",
        status: EmployeeStatus.ACTIVE,
        hireDate: "2026-08-01T00:00:00.000Z",
      });

      await ctx.recruitmentService.createPosition({
        title: "Product Designer",
        department: "Design",
        employmentType: "full_time",
        status: PositionStatus.OPEN,
      });

      const position = await ctx.recruitmentService.listPositions(orgId);
      await ctx.recruitmentService.createCandidate({
        positionId: position[0].id,
        name: "Sam Green",
        email: "sam@example.com",
      });

      await ctx.employeeService.updateEmployee(employee.id, { title: "Senior Software Engineer" });
    });

    const published = ctx.events.filter((e) => e.tenantId === orgId);
    const types = published.map((e) => e.type);
    expect(types).toContain(HrEventType.EMPLOYEE_HIRED);
    expect(types).toContain(HrEventType.EMPLOYEE_UPDATED);
    expect(types).toContain(HrEventType.POSITION_CREATED);
    expect(types).toContain(HrEventType.CANDIDATE_CREATED);

    const hired = published.find((e) => e.type === HrEventType.EMPLOYEE_HIRED);
    expect(hired).toBeDefined();
    expect(hired.payload).toMatchObject({ fullName: "Jane Doe" });
  });
});
