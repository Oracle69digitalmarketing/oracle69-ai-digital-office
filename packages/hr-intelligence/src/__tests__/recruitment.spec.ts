import { describe, it, expect, beforeEach } from "@jest/globals";
import { createHrTestModule, HrTestContext } from "../testing/test-fixture.js";
import { CandidateStage, EmployeeStatus, PositionStatus } from "../types.js";

describe("Recruitment", () => {
  let ctx: HrTestContext;

  beforeEach(() => {
    ctx = createHrTestModule();
  });

  async function createPosition(orgId: string, title = "Engineer") {
    return ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.recruitmentService.createPosition({
        title,
        department: "Engineering",
        employmentType: "full_time",
        status: PositionStatus.OPEN,
      }),
    );
  }

  async function apply(orgId: string, positionId: string, name = "Candidate One") {
    return ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.recruitmentService.createCandidate({
        positionId,
        name,
        email: `${name.replace(/\s+/g, ".").toLowerCase()}@example.com`,
        appliedAt: "2026-08-01T00:00:00.000Z",
      }),
    );
  }

  it("should create an open position and emit position.created", async () => {
    const orgId = "org-rec-1";
    const position = await createPosition(orgId, "Product Manager");

    expect(position.status).toBe(PositionStatus.OPEN);
    expect(position.organizationId).toBe(orgId);
    const event = ctx.events.find((e) => e.type === "hr.position.created");
    expect(event?.tenantId).toBe(orgId);
    expect(event?.payload).toMatchObject({ title: "Product Manager" });
  });

  it("should close a position and emit position.closed", async () => {
    const orgId = "org-rec-2";
    const position = await createPosition(orgId);

    await ctx.recruitmentService.closePosition(position.id, orgId);

    const closed = ctx.events.find((e) => e.type === "hr.position.closed");
    expect(closed).toBeDefined();
    expect(closed?.payload).toMatchObject({ id: position.id, status: PositionStatus.CLOSED });
  });

  it("should advance a candidate through the pipeline and emit stage events", async () => {
    const orgId = "org-rec-3";
    const position = await createPosition(orgId);
    const candidate = await apply(orgId, position.id, "Sara Kim");

    expect(candidate.stage).toBe(CandidateStage.APPLIED);

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.recruitmentService.updateCandidateStage(candidate.id, CandidateStage.SCREENING, orgId),
    );
    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.recruitmentService.updateCandidateStage(candidate.id, CandidateStage.INTERVIEWING, orgId),
    );
    const offered = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.recruitmentService.updateCandidateStage(candidate.id, CandidateStage.OFFER, orgId),
    );

    expect(offered.stage).toBe(CandidateStage.OFFER);
    expect(offered.offeredAt).toBeDefined();

    const stageEvents = ctx.events.filter((e) => e.type === "hr.candidate.stage.updated");
    expect(stageEvents).toHaveLength(3);
  });

  it("should hire a candidate, create an employee, fill the position and emit events", async () => {
    const orgId = "org-rec-4";
    const position = await createPosition(orgId);
    const candidate = await apply(orgId, position.id, "Maya Lin");

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.recruitmentService.hireCandidate(candidate.id, orgId),
    );

    const hiredCandidate = await ctx.recruitmentService.listCandidates(orgId, CandidateStage.HIRED);
    expect(hiredCandidate).toHaveLength(1);
    expect(hiredCandidate[0].hiredAt).toBeDefined();

    const employees = await ctx.employeeService.listEmployees(orgId);
    expect(employees).toHaveLength(1);
    expect(employees[0].fullName).toBe("Maya Lin");
    expect(employees[0].status).toBe(EmployeeStatus.ONBOARDING);
    expect(employees[0].title).toBe("Engineer");

    const positions = await ctx.recruitmentService.listPositions(orgId);
    expect(positions[0].status).toBe(PositionStatus.FILLED);

    const types = ctx.events.map((e) => e.type);
    expect(types).toContain("hr.candidate.hired");
    expect(types).toContain("hr.employee.hired");
  });

  it("should reject stage changes for hired or rejected candidates", async () => {
    const orgId = "org-rec-5";
    const position = await createPosition(orgId);
    const candidate = await apply(orgId, position.id);

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.recruitmentService.hireCandidate(candidate.id, orgId),
    );

    await expect(
      ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
        ctx.recruitmentService.updateCandidateStage(candidate.id, CandidateStage.REJECTED, orgId),
      ),
    ).rejects.toThrow("Cannot change stage");
  });

  it("should not create a candidate for a position of another tenant", async () => {
    const orgId = "org-rec-6";
    const attacker = "org-rec-7";
    const position = await createPosition(orgId);

    await expect(
      ctx.tenantContext.runAsync({ tenantId: attacker }, () =>
        ctx.recruitmentService.createCandidate({
          positionId: position.id,
          name: "X",
          email: "x@example.com",
        }),
      ),
    ).rejects.toThrow("Position not found");
  });

  it("should enforce tenant isolation for candidates", async () => {
    const owner = "org-rec-owner";
    const attacker = "org-rec-attacker";
    const position = await createPosition(owner);
    const candidate = await apply(owner, position.id, "Nina Simone");

    await expect(ctx.recruitmentService.listCandidates(attacker)).resolves.toEqual([]);
    await expect(ctx.recruitmentService.hireCandidate(candidate.id, attacker)).rejects.toThrow(
      "Candidate not found",
    );
  });
});
