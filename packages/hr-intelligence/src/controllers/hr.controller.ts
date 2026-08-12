import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service.js';
import { RecruitmentService } from '../services/recruitment.service.js';
import { HrKpiService } from '../services/hr-kpi.service.js';
import { HrHealthService } from '../services/hr-health.service.js';
import { HrAiService } from '../services/hr-ai.service.js';
import { CandidateStage, EmployeeStatus, PositionStatus } from '../types.js';
import { TenantContextService } from '@oracle69/runtime';

/**
 * Tenant-scoped REST surface for Human Resources Intelligence.
 *
 * Every route is executed inside a {@link TenantContextService} scope resolved
 * from the `organizationId` path segment, so the canonical services and the
 * EventBus inherit the tenant without any cross-tenant reads or writes.
 */
@Controller('hr')
export class HrController {
  constructor(
    private readonly kpiService: HrKpiService,
    private readonly healthService: HrHealthService,
    private readonly aiService: HrAiService,
    private readonly employeeService: EmployeeService,
    private readonly recruitmentService: RecruitmentService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(':organizationId/kpis')
  getKpis(@Param('organizationId') organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () => this.kpiService.getKpis(organizationId));
  }

  @Get(':organizationId/health')
  getHealth(@Param('organizationId') organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () => this.healthService.assess(organizationId));
  }

  @Get(':organizationId/insights')
  async getInsights(@Param('organizationId') organizationId: string) {
    return this.tenantContext.run({ tenantId: organizationId }, async () => {
      const health = await this.healthService.assess(organizationId);
      return this.aiService.generateInsights(health);
    });
  }

  @Get(':organizationId/employees')
  listEmployees(
    @Param('organizationId') organizationId: string,
    @Query('status') status?: EmployeeStatus,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.employeeService.listEmployees(organizationId, status),
    );
  }

  @Post(':organizationId/employees')
  hireEmployee(
    @Param('organizationId') organizationId: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.employeeService.hireEmployee({ ...body, organizationId }),
    );
  }

  @Patch(':organizationId/employees/:id')
  updateEmployee(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.employeeService.updateEmployee(id, { ...body, organizationId }),
    );
  }

  @Post(':organizationId/employees/:id/offboard')
  offboardEmployee(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () => this.employeeService.offboardEmployee(id, organizationId));
  }

  @Get(':organizationId/positions')
  listPositions(
    @Param('organizationId') organizationId: string,
    @Query('status') status?: PositionStatus,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.recruitmentService.listPositions(organizationId, status),
    );
  }

  @Post(':organizationId/positions')
  createPosition(
    @Param('organizationId') organizationId: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.recruitmentService.createPosition({ ...body, organizationId }),
    );
  }

  @Patch(':organizationId/positions/:id')
  updatePosition(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.recruitmentService.updatePosition(id, { ...body, organizationId }),
    );
  }

  @Post(':organizationId/positions/:id/close')
  closePosition(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () => this.recruitmentService.closePosition(id, organizationId));
  }

  @Get(':organizationId/candidates')
  listCandidates(
    @Param('organizationId') organizationId: string,
    @Query('stage') stage?: CandidateStage,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.recruitmentService.listCandidates(organizationId, stage),
    );
  }

  @Post(':organizationId/candidates')
  createCandidate(
    @Param('organizationId') organizationId: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.recruitmentService.createCandidate({ ...body, organizationId }),
    );
  }

  @Patch(':organizationId/candidates/:id/stage')
  updateCandidateStage(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tenantContext.run({ tenantId: organizationId }, () =>
      this.recruitmentService.updateCandidateStage(id, body.stage, organizationId),
    );
  }

  @Post(':organizationId/candidates/:id/hire')
  hireCandidate(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    return this.tenantContext.run({ tenantId: organizationId }, () => this.recruitmentService.hireCandidate(id, organizationId));
  }
}
