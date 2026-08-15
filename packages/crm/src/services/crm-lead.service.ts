import { Injectable } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { CrmLeadRepository } from '../repositories/crm-lead.repository.js';
import { CreateCrmLeadDto, UpdateCrmLeadDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmLeadService {
  constructor(
    private readonly repository: CrmLeadRepository,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  async createLead(data: CreateCrmLeadDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const lead = await this.repository.create({ ...data, organizationId: tenantId });
    
    this.messageBus.publish(
      CrmEventType.LEAD_CREATED,
      new CrmEvent(CrmEventType.LEAD_CREATED, { lead }),
      { tenantId }
    );

    return lead;
  }

  async updateLead(id: string, data: UpdateCrmLeadDto & { organizationId?: string }) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const lead = await this.repository.update(id, tenantId, data);

    this.messageBus.publish(
      CrmEventType.LEAD_UPDATED,
      new CrmEvent(CrmEventType.LEAD_UPDATED, { lead }),
      { tenantId }
    );

    if (data.status === 'qualified') {
      this.messageBus.publish(
        CrmEventType.LEAD_QUALIFIED,
        new CrmEvent(CrmEventType.LEAD_QUALIFIED, { leadId: id }),
        { tenantId }
      );
    } else if (data.status === 'disqualified') {
      this.messageBus.publish(
        CrmEventType.LEAD_DISQUALIFIED,
        new CrmEvent(CrmEventType.LEAD_DISQUALIFIED, { leadId: id }),
        { tenantId }
      );
    }

    return lead;
  }

  async deleteLead(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    const lead = await this.repository.delete(id, tenantId);

    this.messageBus.publish(
      CrmEventType.LEAD_DELETED,
      new CrmEvent(CrmEventType.LEAD_DELETED, { leadId: id }),
      { tenantId }
    );

    return lead;
  }

  async getLead(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.findById(id, tenantId);
  }

  async listLeads(organizationId?: string) {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.repository.findAll(tenantId);
  }
}
