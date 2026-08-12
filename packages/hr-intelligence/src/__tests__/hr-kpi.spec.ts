import { describe, it, expect, beforeEach } from '@jest/globals';
import { createHrTestModule, HrTestContext } from '../testing/test-fixture.js';
import { CandidateStage, EmployeeStatus, PositionStatus } from '../types.js';

describe('HR KPI computation', () => {
  let ctx: HrTestContext;

  beforeEach(() => {
    ctx = createHrTestModule();
  });

  it('should compute headcount and turnover from employees', async () => {
    const orgId = 'org-kpi-1';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const active = await ctx.employeeService.hireEmployee({
        fullName: 'One',
        email: 'one@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-01-01T00:00:00.000Z',
      });
      await ctx.employeeService.hireEmployee({
        fullName: 'Two',
        email: 'two@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-02-01T00:00:00.000Z',
      });
      await ctx.employeeService.hireEmployee({
        fullName: 'Three',
        email: 'three@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ONBOARDING,
        hireDate: '2026-03-01T00:00:00.000Z',
      });
      await ctx.employeeService.offboardEmployee(active.id, orgId);
    });

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.headcount).toBe(2);
    expect(kpis.activeHeadcount).toBe(1);
    expect(kpis.onboardingCount).toBe(1);
    expect(kpis.turnoverCount).toBe(1);
    expect(kpis.turnoverRate).toBeCloseTo(1 / 2, 5);
  });

  it('should compute open positions and pipeline coverage', async () => {
    const orgId = 'org-kpi-2';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const position = await ctx.recruitmentService.createPosition({
        title: 'Engineer',
        department: 'Eng',
        employmentType: 'full_time',
      });
      await ctx.recruitmentService.createPosition({
        title: 'Designer',
        department: 'Design',
        employmentType: 'full_time',
      });
      await ctx.recruitmentService.createCandidate({
        positionId: position.id,
        name: 'C1',
        email: 'c1@example.com',
      });
      await ctx.recruitmentService.createCandidate({
        positionId: position.id,
        name: 'C2',
        email: 'c2@example.com',
      });
    });

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.openPositions).toBe(2);
    expect(kpis.candidatesInPipeline).toBe(2);
    expect(kpis.filledPositions).toBe(0);
  });

  it('should compute offer acceptance and time-to-hire for hired candidates', async () => {
    const orgId = 'org-kpi-3';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const position = await ctx.recruitmentService.createPosition({
        title: 'Engineer',
        department: 'Eng',
        employmentType: 'full_time',
      });
      const c1 = await ctx.recruitmentService.createCandidate({
        positionId: position.id,
        name: 'Hired',
        email: 'hired@example.com',
        appliedAt: '2026-08-01T00:00:00.000Z',
      });
      const c2 = await ctx.recruitmentService.createCandidate({
        positionId: position.id,
        name: 'Offer Pending',
        email: 'offer@example.com',
        appliedAt: '2026-08-05T00:00:00.000Z',
      });
      await ctx.recruitmentService.updateCandidateStage(c2.id, CandidateStage.OFFER, orgId);

      // Directly persist a hire date for a deterministic time-to-hire.
      await ctx.recruitmentService.hireCandidate(c1.id, orgId);
    });

    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.hiredCandidates).toBe(1);
    expect(kpis.offerAcceptanceRate).toBeCloseTo(1 / 2, 5);
    expect(kpis.averageTimeToHireDays).toBeGreaterThanOrEqual(0);
  });

  it('should return zero-based KPIs for an empty organization', async () => {
    const orgId = 'org-kpi-4';
    const kpis = await ctx.kpiService.getKpis(orgId);
    expect(kpis.headcount).toBe(0);
    expect(kpis.turnoverRate).toBe(0);
    expect(kpis.openPositions).toBe(0);
    expect(kpis.candidatesInPipeline).toBe(0);
    expect(kpis.offerAcceptanceRate).toBe(0);
    expect(kpis.averageTimeToHireDays).toBe(0);
  });

  it('should keep KPIs tenant-scoped', async () => {
    const owner = 'org-kpi-owner';
    const attacker = 'org-kpi-attacker';
    await ctx.tenantContext.runAsync({ tenantId: owner }, () =>
      ctx.employeeService.hireEmployee({
        fullName: 'Owner Employee',
        email: 'owner@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-01-01T00:00:00.000Z',
      }),
    );

    const attackerKpis = await ctx.kpiService.getKpis(attacker);
    expect(attackerKpis.headcount).toBe(0);

    const ownerKpis = await ctx.kpiService.getKpis(owner);
    expect(ownerKpis.headcount).toBe(1);
  });
});
