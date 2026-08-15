import { Injectable } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { CrmOpportunityRepository } from '../repositories/crm-opportunity.repository.js';
import { CreateCrmOpportunityDto, UpdateCrmOpportunityDto, CreateCrmPipelineDto, UpdateCrmPipelineDto, CreateCrmPipelineStageDto, UpdateCrmPipelineStageDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmOpportunityService {
  constructor(
    private readonly repository: CrmOpportunityRepository,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  // Opportunity Methods
  async createOpportunity(data: CreateCrmOpportunityDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const opportunity = await this.repository.createOpportunity({ ...data, organizationId: tenantId });
    
    this.messageBus.publish(
      CrmEventType.OPPORTUNITY_CREATED,
      new CrmEvent(CrmEventType.OPPORTUNITY_CREATED, { opportunity }),
      { tenantId }
    );

    return opportunity;
  }

  async updateOpportunity(id: string, data: UpdateCrmOpportunityDto & { organizationId?: string }) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const oldOpportunity = await this.repository.findOpportunityById(id, tenantId);
    const opportunity = await this.repository.updateOpportunity(id, tenantId, data);

    this.messageBus.publish(
      CrmEventType.OPPORTUNITY_UPDATED,
      new CrmEvent(CrmEventType.OPPORTUNITY_UPDATED, { opportunity }),
      { tenantId }
    );

    if (data.stage && oldOpportunity?.stage !== data.stage) {
      this.messageBus.publish(
        CrmEventType.OPPORTUNITY_STAGE_CHANGED,
        new CrmEvent(CrmEventType.OPPORTUNITY_STAGE_CHANGED, { 
          opportunityId: id, 
          oldStage: oldOpportunity?.stage,
          newStage: data.stage 
        }),
        { tenantId }
      );

      if (data.stage === 'won') {
        this.messageBus.publish(
          CrmEventType.OPPORTUNITY_WON,
          new CrmEvent(CrmEventType.OPPORTUNITY_WON, { opportunityId: id }),
          { tenantId }
        );
      } else if (data.stage === 'lost') {
        this.messageBus.publish(
          CrmEventType.OPPORTUNITY_LOST,
          new CrmEvent(CrmEventType.OPPORTUNITY_LOST, { opportunityId: id }),
          { tenantId }
        );
      }
    }

    return opportunity;
  }

  async deleteOpportunity(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    const opportunity = await this.repository.deleteOpportunity(id, tenantId);

    this.messageBus.publish(
      CrmEventType.OPPORTUNITY_DELETED,
      new CrmEvent(CrmEventType.OPPORTUNITY_DELETED, { opportunityId: id }),
      { tenantId }
    );

    return opportunity;
  }

  async getOpportunity(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.findOpportunityById(id, tenantId);
  }

  async listOpportunities(organizationId?: string) {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.repository.findOpportunitiesByOrganization(tenantId);
  }

  // Pipeline Methods
  async createPipeline(data: CreateCrmPipelineDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    return this.repository.createPipeline({ ...data, organizationId: tenantId });
  }

  async updatePipeline(id: string, data: UpdateCrmPipelineDto & { organizationId?: string }) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    return this.repository.updatePipeline(id, tenantId, data);
  }

  async deletePipeline(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.deletePipeline(id, tenantId);
  }

  async getPipeline(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.findPipelineById(id, tenantId);
  }

  async listPipelines(organizationId?: string) {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.repository.findAllPipelines(tenantId);
  }

  // Pipeline Stage Methods
  async createPipelineStage(data: CreateCrmPipelineStageDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    return this.repository.createPipelineStage({ ...data, organizationId: tenantId });
  }

  async updatePipelineStage(id: string, data: UpdateCrmPipelineStageDto & { organizationId?: string }) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    return this.repository.updatePipelineStage(id, tenantId, data);
  }

  async deletePipelineStage(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.deletePipelineStage(id, tenantId);
  }
}
