import { describe, it, expect, beforeEach } from '@jest/globals';
import { createHrTestModule, HrTestContext } from '../testing/test-fixture.js';
import { EmployeeStatus, PositionStatus } from '../types.js';

describe('HR health assessment', () => {
  let ctx: HrTestContext;

  beforeEach(() => {
    ctx = createHrTestModule();
  });

  it('should be healthy for a stable workforce', async () => {
    const orgId = 'org-health-1';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.employeeService.hireEmployee({
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
    });

    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe('healthy');
    expect(health.score).toBeGreaterThanOrEqual(80);
    expect(health.reasoning.length).toBeGreaterThan(0);
    expect(health.openPositions).toBe(0);
  });

  it('should be critical when the workforce is empty', async () => {
    const orgId = 'org-health-2';
    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe('critical');
    expect(health.score).toBeLessThan(30);
  });

  it('should penalize high turnover', async () => {
    const orgId = 'org-health-3';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      const a = await ctx.employeeService.hireEmployee({
        fullName: 'A',
        email: 'a@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-01-01T00:00:00.000Z',
      });
      await ctx.employeeService.hireEmployee({
        fullName: 'B',
        email: 'b@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-02-01T00:00:00.000Z',
      });
      await ctx.employeeService.hireEmployee({
        fullName: 'C',
        email: 'c@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-03-01T00:00:00.000Z',
      });
      await ctx.employeeService.hireEmployee({
        fullName: 'D',
        email: 'd@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-04-01T00:00:00.000Z',
      });
      await ctx.employeeService.offboardEmployee(a.id, orgId);
    });

    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe('at_risk');
    expect(health.kpis.turnoverRate).toBe(0.25);
  });

  it('should penalize a thin candidate pipeline against open positions', async () => {
    const orgId = 'org-health-4';
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.employeeService.hireEmployee({
        fullName: 'One',
        email: 'one@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-01-01T00:00:00.000Z',
      });
      await ctx.recruitmentService.createPosition({
        title: 'Engineer',
        department: 'Eng',
        employmentType: 'full_time',
        status: PositionStatus.OPEN,
      });
      await ctx.recruitmentService.createPosition({
        title: 'Designer',
        department: 'Design',
        employmentType: 'full_time',
        status: PositionStatus.OPEN,
      });
      await ctx.recruitmentService.createPosition({
        title: 'Manager',
        department: 'Ops',
        employmentType: 'full_time',
        status: PositionStatus.OPEN,
      });
    });

    const health = await ctx.healthService.assess(orgId);
    expect(health.status).toBe('at_risk');
    expect(health.openPositions).toBe(3);
    expect(health.candidatesInPipeline).toBe(0);
  });

  it('should enforce tenant isolation', async () => {
    const owner = 'org-health-owner';
    await ctx.tenantContext.runAsync({ tenantId: owner }, () =>
      ctx.employeeService.hireEmployee({
        fullName: 'Owner',
        email: 'owner@example.com',
        department: 'Eng',
        title: 'E',
        status: EmployeeStatus.ACTIVE,
        hireDate: '2026-01-01T00:00:00.000Z',
      }),
    );

    const attackerHealth = await ctx.healthService.assess('org-health-attacker');
    expect(attackerHealth.kpis.headcount).toBe(0);
    expect(attackerHealth.status).toBe('critical');
  });
});
