import { Inject, Injectable } from '@nestjs/common';
import { HR_POSITION_REPOSITORY, type PositionRepository } from '../repositories/position.repository.js';
import { HR_CANDIDATE_REPOSITORY, type CandidateRepository } from '../repositories/candidate.repository.js';
import { CandidateStage, EmployeeStatus, EmploymentType, HrCandidate, HrPosition, PositionStatus } from '../types.js';
import { EmployeeService } from './employee.service.js';
import { EventBus, TenantContextService } from '@oracle69/runtime';
import { HrEventType } from '../events/hr.events.js';

const EVENT_SOURCE = 'hr-intelligence';

@Injectable()
export class RecruitmentService {
  constructor(
    @Inject(HR_POSITION_REPOSITORY) private readonly positionRepo: PositionRepository,
    @Inject(HR_CANDIDATE_REPOSITORY) private readonly candidateRepo: CandidateRepository,
    private readonly employeeService: EmployeeService,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createPosition(
    position: Omit<HrPosition, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'> & { organizationId?: string },
  ): Promise<HrPosition> {
    const tenantId = this.tenantContext.resolveTenantId(position.organizationId);
    const created = await this.positionRepo.create({
      ...position,
      status: position.status ?? PositionStatus.OPEN,
      employmentType: position.employmentType ?? EmploymentType.FULL_TIME,
      organizationId: tenantId,
    });
    await this.eventBus.publish(HrEventType.POSITION_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async updatePosition(id: string, data: Partial<HrPosition> & { organizationId?: string }): Promise<HrPosition> {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const existing = await this.positionRepo.findById(id, tenantId);
    if (!existing) throw new Error('Position not found');
    return this.positionRepo.update(id, data);
  }

  async closePosition(id: string, organizationId?: string): Promise<HrPosition> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const existing = await this.positionRepo.findById(id, tenantId);
    if (!existing) throw new Error('Position not found');
    if (existing.status === PositionStatus.CLOSED) return existing;

    const updated = await this.positionRepo.update(id, { status: PositionStatus.CLOSED });
    await this.eventBus.publish(HrEventType.POSITION_CLOSED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async listPositions(organizationId?: string, status?: PositionStatus): Promise<HrPosition[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.positionRepo.findByOrganization(tenantId, status);
  }

  async createCandidate(
    candidate: Omit<HrCandidate, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'stage'> &
      { organizationId?: string; stage?: CandidateStage },
  ): Promise<HrCandidate> {
    const tenantId = this.tenantContext.resolveTenantId(candidate.organizationId);
    const position = await this.positionRepo.findById(candidate.positionId, tenantId);
    if (!position) throw new Error('Position not found');

    const created = await this.candidateRepo.create({
      ...candidate,
      stage: candidate.stage ?? CandidateStage.APPLIED,
      appliedAt: candidate.appliedAt ?? new Date().toISOString(),
      organizationId: tenantId,
    });
    await this.eventBus.publish(HrEventType.CANDIDATE_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async updateCandidateStage(id: string, stage: CandidateStage, organizationId?: string): Promise<HrCandidate> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const candidate = await this.candidateRepo.findById(id, tenantId);
    if (!candidate) throw new Error('Candidate not found');
    if (candidate.stage === CandidateStage.HIRED || candidate.stage === CandidateStage.REJECTED) {
      throw new Error(`Cannot change stage of ${candidate.stage} candidate ${id}`);
    }

    const data: Partial<HrCandidate> = { stage };
    if (stage === CandidateStage.OFFER && !candidate.offeredAt) {
      data.offeredAt = new Date().toISOString();
    }
    if (stage === CandidateStage.HIRED && !candidate.hiredAt) {
      data.hiredAt = new Date().toISOString();
    }

    const updated = await this.candidateRepo.update(id, data);
    await this.eventBus.publish(HrEventType.CANDIDATE_STAGE_UPDATED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });

    if (stage === CandidateStage.HIRED) {
      await this.hireCandidateFrom(updated);
    }
    return updated;
  }

  async hireCandidate(id: string, organizationId?: string): Promise<HrCandidate> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const candidate = await this.candidateRepo.findById(id, tenantId);
    if (!candidate) throw new Error('Candidate not found');
    if (candidate.stage === CandidateStage.HIRED) return candidate;
    if (candidate.stage === CandidateStage.REJECTED) {
      throw new Error(`Cannot hire rejected candidate ${id}`);
    }

    const updated = await this.candidateRepo.update(id, {
      stage: CandidateStage.HIRED,
      ...(candidate.offeredAt ? {} : { offeredAt: new Date().toISOString() }),
      hiredAt: new Date().toISOString(),
    });
    await this.eventBus.publish(HrEventType.CANDIDATE_HIRED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    await this.hireCandidateFrom(updated);
    return updated;
  }

  async listCandidates(organizationId?: string, stage?: CandidateStage): Promise<HrCandidate[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.candidateRepo.findByOrganization(tenantId, stage);
  }

  private async hireCandidateFrom(candidate: HrCandidate): Promise<void> {
    const position = await this.positionRepo.findById(candidate.positionId, candidate.organizationId);

    // The hired candidate joins the workforce through the canonical employee
    // lifecycle and the position is marked as filled.
    await this.employeeService.hireEmployee({
      fullName: candidate.name,
      email: candidate.email,
      department: position?.department ?? 'General',
      title: position?.title ?? 'Team Member',
      status: EmployeeStatus.ONBOARDING,
      hireDate: new Date().toISOString(),
      organizationId: candidate.organizationId,
    });

    if (position && position.status === PositionStatus.OPEN) {
      await this.positionRepo.update(position.id, { status: PositionStatus.FILLED });
    }
  }
}
