import { Injectable } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { CrmLeadRepository } from '../repositories/crm-lead.repository.js';
import { CreateCrmLeadDto, UpdateCrmLeadDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmLeadService {
  constructor(
    private readonly repository: CrmLeadRepository,
    private readonly messageBus: MessageBus
  ) {}

  async createLead(data: CreateCrmLeadDto) {
    const lead = await this.repository.create(data);
    
    this.messageBus.publish(
      CrmEventType.LEAD_CREATED,
      new CrmEvent(CrmEventType.LEAD_CREATED, { lead })
    );

    return lead;
  }

  async updateLead(id: string, data: UpdateCrmLeadDto) {
    const lead = await this.repository.update(id, data);

    this.messageBus.publish(
      CrmEventType.LEAD_UPDATED,
      new CrmEvent(CrmEventType.LEAD_UPDATED, { lead })
    );

    if (data.status === 'qualified') {
      this.messageBus.publish(
        CrmEventType.LEAD_QUALIFIED,
        new CrmEvent(CrmEventType.LEAD_QUALIFIED, { leadId: id })
      );
    } else if (data.status === 'disqualified') {
      this.messageBus.publish(
        CrmEventType.LEAD_DISQUALIFIED,
        new CrmEvent(CrmEventType.LEAD_DISQUALIFIED, { leadId: id })
      );
    }

    return lead;
  }

  async deleteLead(id: string) {
    const lead = await this.repository.delete(id);

    this.messageBus.publish(
      CrmEventType.LEAD_DELETED,
      new CrmEvent(CrmEventType.LEAD_DELETED, { leadId: id })
    );

    return lead;
  }

  async getLead(id: string) {
    return this.repository.findById(id);
  }

  async listLeads(organizationId: string) {
    return this.repository.findAll(organizationId);
  }
}
