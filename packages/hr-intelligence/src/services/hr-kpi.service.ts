import { Inject, Injectable } from '@nestjs/common';
import { HR_EMPLOYEE_REPOSITORY, type EmployeeRepository } from '../repositories/employee.repository.js';
import { HR_POSITION_REPOSITORY, type PositionRepository } from '../repositories/position.repository.js';
import { HR_CANDIDATE_REPOSITORY, type CandidateRepository } from '../repositories/candidate.repository.js';
import { CandidateStage, EmployeeStatus, HrKpis, PositionStatus } from '../types.js';
import { TenantContextService } from '@oracle69/runtime';

@Injectable()
export class HrKpiService {
  constructor(
    @Inject(HR_EMPLOYEE_REPOSITORY) private readonly employeeRepo: EmployeeRepository,
    @Inject(HR_POSITION_REPOSITORY) private readonly positionRepo: PositionRepository,
    @Inject(HR_CANDIDATE_REPOSITORY) private readonly candidateRepo: CandidateRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getKpis(organizationId?: string): Promise<HrKpis> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const [employees, positions, candidates] = await Promise.all([
      this.employeeRepo.findByOrganization(tenantId),
      this.positionRepo.findByOrganization(tenantId),
      this.candidateRepo.findByOrganization(tenantId),
    ]);

    const headcount = employees.filter((e) => e.status === EmployeeStatus.ACTIVE || e.status === EmployeeStatus.ONBOARDING).length;
    const activeHeadcount = employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length;
    const onboardingCount = employees.filter((e) => e.status === EmployeeStatus.ONBOARDING).length;
    const offboardingCount = employees.filter((e) => e.status === EmployeeStatus.OFFBOARDING).length;
    const turnoverCount = employees.filter((e) => e.status === EmployeeStatus.INACTIVE).length;
    const turnoverRate = activeHeadcount + turnoverCount > 0 ? turnoverCount / (activeHeadcount + turnoverCount) : 0;

    const openPositions = positions.filter((p) => p.status === PositionStatus.OPEN).length;
    const filledPositions = positions.filter((p) => p.status === PositionStatus.FILLED || p.status === PositionStatus.CLOSED).length;

    const pipelineStages = new Set([
      CandidateStage.APPLIED,
      CandidateStage.SCREENING,
      CandidateStage.INTERVIEWING,
      CandidateStage.OFFER,
    ]);
    const candidatesInPipeline = candidates.filter((c) => pipelineStages.has(c.stage)).length;
    const hiredCandidates = candidates.filter((c) => c.stage === CandidateStage.HIRED).length;
    const inOffer = candidates.filter((c) => c.stage === CandidateStage.OFFER).length;
    const offers = hiredCandidates + inOffer;
    const offerAcceptanceRate = offers > 0 ? hiredCandidates / offers : 0;

    const timeToHireDays = this.averageTimeToHire(candidates);

    return {
      headcount,
      activeHeadcount,
      onboardingCount,
      offboardingCount,
      turnoverCount,
      turnoverRate,
      openPositions,
      filledPositions,
      candidatesInPipeline,
      hiredCandidates,
      offerAcceptanceRate,
      averageTimeToHireDays: timeToHireDays,
    };
  }

  private averageTimeToHire(candidates: Array<{ appliedAt: string; hiredAt?: string }>): number {
    const hired = candidates.filter((c) => c.hiredAt);
    if (hired.length === 0) return 0;
    const totalDays = hired.reduce((sum, c) => {
      const applied = Date.parse(c.appliedAt);
      const hiredAt = Date.parse(c.hiredAt as string);
      if (Number.isNaN(applied) || Number.isNaN(hiredAt)) return sum;
      return sum + (hiredAt - applied) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round((totalDays / hired.length) * 10) / 10;
  }
}
