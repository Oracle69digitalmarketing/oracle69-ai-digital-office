import { Injectable } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { CrmOrganizationRepository } from '../repositories/crm-organization.repository.js';
import { CreateCrmOrganizationDto, UpdateCrmOrganizationDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmOrganizationService {
  constructor(
    private readonly repository: CrmOrganizationRepository,
    private readonly messageBus: MessageBus
  ) {}

  async createOrganization(data: CreateCrmOrganizationDto) {
    const organization = await this.repository.create(data);
    
    this.messageBus.publish(
      CrmEventType.ORGANIZATION_CREATED,
      new CrmEvent(CrmEventType.ORGANIZATION_CREATED, { organization })
    );

    return organization;
  }

  async updateOrganization(id: string, data: UpdateCrmOrganizationDto) {
    const organization = await this.repository.update(id, data);

    this.messageBus.publish(
      CrmEventType.ORGANIZATION_UPDATED,
      new CrmEvent(CrmEventType.ORGANIZATION_UPDATED, { organization })
    );

    return organization;
  }

  async deleteOrganization(id: string) {
    const organization = await this.repository.delete(id);

    this.messageBus.publish(
      CrmEventType.ORGANIZATION_DELETED,
      new CrmEvent(CrmEventType.ORGANIZATION_DELETED, { organizationId: id })
    );

    return organization;
  }

  async getOrganization(id: string) {
    return this.repository.findById(id);
  }

  async listOrganizations(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async searchOrganizations(organizationId: string, query: string) {
    return this.repository.search(organizationId, query);
  }
}
