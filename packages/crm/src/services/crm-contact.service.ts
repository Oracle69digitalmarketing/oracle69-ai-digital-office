import { Injectable } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { CrmContactRepository } from '../repositories/crm-contact.repository.js';
import { CreateCrmContactDto, UpdateCrmContactDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmContactService {
  constructor(
    private readonly repository: CrmContactRepository,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  async createContact(data: CreateCrmContactDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const contact = await this.repository.create({ ...data, organizationId: tenantId });
    
    this.messageBus.publish(
      CrmEventType.CONTACT_CREATED,
      new CrmEvent(CrmEventType.CONTACT_CREATED, { contact }),
      { tenantId }
    );

    return contact;
  }

  async updateContact(id: string, data: UpdateCrmContactDto & { organizationId?: string }) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const contact = await this.repository.update(id, tenantId, data);

    this.messageBus.publish(
      CrmEventType.CONTACT_UPDATED,
      new CrmEvent(CrmEventType.CONTACT_UPDATED, { contact }),
      { tenantId }
    );

    return contact;
  }

  async deleteContact(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    const contact = await this.repository.delete(id, tenantId);

    this.messageBus.publish(
      CrmEventType.CONTACT_DELETED,
      new CrmEvent(CrmEventType.CONTACT_DELETED, { contactId: id }),
      { tenantId }
    );

    return contact;
  }

  async getContact(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.findById(id, tenantId);
  }

  async listContacts(organizationId?: string) {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.repository.findAll(tenantId);
  }

  async searchContacts(query: string, organizationId?: string) {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.repository.search(tenantId, query);
  }
}
