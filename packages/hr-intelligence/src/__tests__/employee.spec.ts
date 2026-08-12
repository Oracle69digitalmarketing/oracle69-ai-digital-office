import { describe, it, expect, beforeEach } from '@jest/globals';
import { createHrTestModule, HrTestContext } from '../testing/test-fixture.js';
import { EmployeeStatus } from '../types.js';

describe('Employee management', () => {
  let ctx: HrTestContext;

  beforeEach(() => {
    ctx = createHrTestModule();
  });

  async function hire(orgId: string, name: string, title: string, status = EmployeeStatus.ACTIVE) {
    return ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.employeeService.hireEmployee({
        fullName: name,
        email: `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
        department: 'Engineering',
        title,
        status,
        hireDate: '2026-08-01T00:00:00.000Z',
      }),
    );
  }

  it('should hire an employee with onboarding status by default and emit employee.hired', async () => {
    const orgId = 'org-emp-1';
    const employee = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.employeeService.hireEmployee({
        fullName: 'Alice Cooper',
        email: 'alice@example.com',
        department: 'Sales',
        title: 'Account Executive',
        hireDate: '2026-08-01T00:00:00.000Z',
      }),
    );

    expect(employee.organizationId).toBe(orgId);
    expect(employee.status).toBe(EmployeeStatus.ONBOARDING);
    const hired = ctx.events.find((e) => e.type === 'hr.employee.hired');
    expect(hired?.tenantId).toBe(orgId);
    expect(hired?.payload).toMatchObject({ id: employee.id, fullName: 'Alice Cooper' });
  });

  it('should update an employee and emit employee.updated', async () => {
    const orgId = 'org-emp-2';
    const employee = await hire(orgId, 'Bob Lee', 'Engineer');

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.employeeService.updateEmployee(employee.id, { title: 'Senior Engineer', status: EmployeeStatus.ACTIVE }),
    );

    const updated = await ctx.employeeService.findById(employee.id, orgId);
    expect(updated?.title).toBe('Senior Engineer');
    expect(updated?.status).toBe(EmployeeStatus.ACTIVE);

    const updatedEvent = ctx.events.find((e) => e.type === 'hr.employee.updated');
    expect(updatedEvent).toBeDefined();
    expect(updatedEvent?.tenantId).toBe(orgId);
  });

  it('should offboard an employee, stamp the termination date and emit employee.offboarded', async () => {
    const orgId = 'org-emp-3';
    const employee = await hire(orgId, 'Carol Danvers', 'Manager');

    const offboarded = await ctx.employeeService.offboardEmployee(employee.id, orgId);

    expect(offboarded.status).toBe(EmployeeStatus.INACTIVE);
    expect(offboarded.terminationDate).toBeDefined();

    const event = ctx.events.find((e) => e.type === 'hr.employee.offboarded');
    expect(event).toBeDefined();
    expect(event?.tenantId).toBe(orgId);
    expect(event?.payload).toMatchObject({ id: employee.id, status: EmployeeStatus.INACTIVE });
  });

  it('should not offboard an employee twice', async () => {
    const orgId = 'org-emp-4';
    const employee = await hire(orgId, 'Dave Evans', 'Analyst');

    await ctx.employeeService.offboardEmployee(employee.id, orgId);
    const offboardEvents = ctx.events.filter((e) => e.type === 'hr.employee.offboarded');
    expect(offboardEvents).toHaveLength(1);

    await ctx.employeeService.offboardEmployee(employee.id, orgId);
    expect(ctx.events.filter((e) => e.type === 'hr.employee.offboarded')).toHaveLength(1);
  });

  it('should filter employees by status', async () => {
    const orgId = 'org-emp-5';
    await hire(orgId, 'Eve Adams', 'Designer');
    await hire(orgId, 'Frank Ocean', 'Engineer', EmployeeStatus.ONBOARDING);

    const active = await ctx.employeeService.listEmployees(orgId, EmployeeStatus.ACTIVE);
    expect(active).toHaveLength(1);
    expect(active[0].fullName).toBe('Eve Adams');
  });

  it('should enforce tenant isolation for employee operations', async () => {
    const owner = 'org-emp-owner';
    const attacker = 'org-emp-attacker';
    const employee = await hire(owner, 'Grace Hopper', 'Engineer');

    await expect(ctx.employeeService.findById(employee.id, attacker)).resolves.toBeNull();
    await expect(ctx.employeeService.updateEmployee(employee.id, { title: 'Hacked', organizationId: attacker })).rejects.toThrow(
      'Employee not found',
    );
    await expect(ctx.employeeService.offboardEmployee(employee.id, attacker)).rejects.toThrow('Employee not found');
    expect(await ctx.employeeService.listEmployees(attacker)).toEqual([]);
  });
});
