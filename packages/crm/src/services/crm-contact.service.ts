import { Injectable } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { CrmContactRepository } from '../repositories/crm-contact.repository.js';
import { CreateCrmContactDto, UpdateCrmContactDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmContactService {
  constructor(
    private readonly repository: CrmContactRepository,
    private readonly messageBus: MessageBus
  ) {}

  async createContact(data: CreateCrmContactDto) {
    const contact = await this.repository.create(data);
    
    this.messageBus.publish(
      CrmEventType.CONTACT_CREATED,
      new CrmEvent(CrmEventType.CONTACT_CREATED, { contact })
    );

    return contact;
  }

  async updateContact(id: string, data: UpdateCrmContactDto) {
    const contact = await this.repository.update(id, data);

    this.messageBus.publish(
      CrmEventType.CONTACT_UPDATED,
      new CrmEvent(CrmEventType.CONTACT_UPDATED, { contact })
    );

    return contact;
  }

  async deleteContact(id: string) {
    const contact = await this.repository.delete(id);

    this.messageBus.publish(
      CrmEventType.CONTACT_DELETED,
      new CrmEvent(CrmEventType.CONTACT_DELETED, { contactId: id })
    );

    return contact;
  }

  async getContact(id: string) {
    return this.repository.findById(id);
  }

  async listContacts(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async searchContacts(organizationId: string, query: string) {
    return this.repository.search(organizationId, query);
  }
}
