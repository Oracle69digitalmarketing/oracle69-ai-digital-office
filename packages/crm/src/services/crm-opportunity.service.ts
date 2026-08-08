import { Injectable } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { CrmOpportunityRepository } from '../repositories/crm-opportunity.repository.js';
import { CreateCrmOpportunityDto, UpdateCrmOpportunityDto, CreateCrmPipelineDto, UpdateCrmPipelineDto, CreateCrmPipelineStageDto, UpdateCrmPipelineStageDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmOpportunityService {
  constructor(
    private readonly repository: CrmOpportunityRepository,
    private readonly messageBus: MessageBus
  ) {}

  // Opportunity Methods
  async createOpportunity(data: CreateCrmOpportunityDto) {
    const opportunity = await this.repository.createOpportunity(data);
    
    this.messageBus.publish(
      CrmEventType.OPPORTUNITY_CREATED,
      new CrmEvent(CrmEventType.OPPORTUNITY_CREATED, { opportunity })
    );

    return opportunity;
  }

  async updateOpportunity(id: string, data: UpdateCrmOpportunityDto) {
    const oldOpportunity = await this.repository.findOpportunityById(id);
    const opportunity = await this.repository.updateOpportunity(id, data);

    this.messageBus.publish(
      CrmEventType.OPPORTUNITY_UPDATED,
      new CrmEvent(CrmEventType.OPPORTUNITY_UPDATED, { opportunity })
    );

    if (data.stage && oldOpportunity?.stage !== data.stage) {
      this.messageBus.publish(
        CrmEventType.OPPORTUNITY_STAGE_CHANGED,
        new CrmEvent(CrmEventType.OPPORTUNITY_STAGE_CHANGED, { 
          opportunityId: id, 
          oldStage: oldOpportunity?.stage,
          newStage: data.stage 
        })
      );

      if (data.stage === 'won') {
        this.messageBus.publish(
          CrmEventType.OPPORTUNITY_WON,
          new CrmEvent(CrmEventType.OPPORTUNITY_WON, { opportunityId: id })
        );
      } else if (data.stage === 'lost') {
        this.messageBus.publish(
          CrmEventType.OPPORTUNITY_LOST,
          new CrmEvent(CrmEventType.OPPORTUNITY_LOST, { opportunityId: id })
        );
      }
    }

    return opportunity;
  }

  async deleteOpportunity(id: string) {
    const opportunity = await this.repository.deleteOpportunity(id);

    this.messageBus.publish(
      CrmEventType.OPPORTUNITY_DELETED,
      new CrmEvent(CrmEventType.OPPORTUNITY_DELETED, { opportunityId: id })
    );

    return opportunity;
  }

  async getOpportunity(id: string) {
    return this.repository.findOpportunityById(id);
  }

  async listOpportunities(organizationId: string) {
    return this.repository.findOpportunitiesByOrganization(organizationId);
  }

  // Pipeline Methods
  async createPipeline(data: CreateCrmPipelineDto) {
    return this.repository.createPipeline(data);
  }

  async updatePipeline(id: string, data: UpdateCrmPipelineDto) {
    return this.repository.updatePipeline(id, data);
  }

  async deletePipeline(id: string) {
    return this.repository.deletePipeline(id);
  }

  async getPipeline(id: string) {
    return this.repository.findPipelineById(id);
  }

  async listPipelines(organizationId: string) {
    return this.repository.findAllPipelines(organizationId);
  }

  // Pipeline Stage Methods
  async createPipelineStage(data: CreateCrmPipelineStageDto) {
    return this.repository.createPipelineStage(data);
  }

  async updatePipelineStage(id: string, data: UpdateCrmPipelineStageDto) {
    return this.repository.updatePipelineStage(id, data);
  }

  async deletePipelineStage(id: string) {
    return this.repository.deletePipelineStage(id);
  }
}
