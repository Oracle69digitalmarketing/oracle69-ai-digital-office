import { Inject, Injectable } from '@nestjs/common';
import { HR_EMPLOYEE_REPOSITORY, type EmployeeRepository } from '../repositories/employee.repository.js';
import { EmployeeStatus, HrEmployee } from '../types.js';
import { EventBus, TenantContextService } from '@oracle69/runtime';
import { HrEventType } from '../events/hr.events.js';

const EVENT_SOURCE = 'hr-intelligence';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject(HR_EMPLOYEE_REPOSITORY) private readonly employeeRepo: EmployeeRepository,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async hireEmployee(
    employee: Omit<HrEmployee, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'> & { organizationId?: string },
  ): Promise<HrEmployee> {
    const tenantId = this.tenantContext.resolveTenantId(employee.organizationId);
    const created = await this.employeeRepo.create({
      ...employee,
      status: employee.status ?? EmployeeStatus.ONBOARDING,
      organizationId: tenantId,
    });
    await this.eventBus.publish(HrEventType.EMPLOYEE_HIRED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async updateEmployee(id: string, data: Partial<HrEmployee> & { organizationId?: string }): Promise<HrEmployee> {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const existing = await this.employeeRepo.findById(id, tenantId);
    if (!existing) throw new Error('Employee not found');
    const updated = await this.employeeRepo.update(id, data);
    await this.eventBus.publish(HrEventType.EMPLOYEE_UPDATED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async offboardEmployee(id: string, organizationId?: string): Promise<HrEmployee> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const existing = await this.employeeRepo.findById(id, tenantId);
    if (!existing) throw new Error('Employee not found');
    if (existing.status === EmployeeStatus.INACTIVE) return existing;

    const updated = await this.employeeRepo.update(id, {
      status: EmployeeStatus.INACTIVE,
      terminationDate: new Date().toISOString(),
    });
    await this.eventBus.publish(HrEventType.EMPLOYEE_OFFBOARDED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async listEmployees(organizationId?: string, status?: EmployeeStatus): Promise<HrEmployee[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.employeeRepo.findByOrganization(tenantId, status);
  }

  async findById(id: string, organizationId?: string): Promise<HrEmployee | null> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.employeeRepo.findById(id, tenantId);
  }
}
