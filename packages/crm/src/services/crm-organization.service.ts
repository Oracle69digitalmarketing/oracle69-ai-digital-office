import { Injectable } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { CrmOrganizationRepository } from '../repositories/crm-organization.repository.js';
import { CreateCrmOrganizationDto, UpdateCrmOrganizationDto, CrmDashboardOrganizationDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmOrganizationService {
  constructor(
    private readonly repository: CrmOrganizationRepository,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  async createOrganization(data: CreateCrmOrganizationDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.id);
    const organization = await this.repository.create({ ...data, id: tenantId });
    
    this.messageBus.publish(
      CrmEventType.ORGANIZATION_CREATED,
      new CrmEvent(CrmEventType.ORGANIZATION_CREATED, { organization }),
      { tenantId }
    );

    return organization;
  }

  async updateOrganization(id: string, data: UpdateCrmOrganizationDto) {
    const tenantId = this.tenantContext.resolveTenantId(id);
    const organization = await this.repository.update(id, tenantId, data);

    this.messageBus.publish(
      CrmEventType.ORGANIZATION_UPDATED,
      new CrmEvent(CrmEventType.ORGANIZATION_UPDATED, { organization }),
      { tenantId }
    );

    return organization;
  }

  async deleteOrganization(id: string) {
    const tenantId = this.tenantContext.resolveTenantId(id);
    const organization = await this.repository.delete(id, tenantId);

    this.messageBus.publish(
      CrmEventType.ORGANIZATION_DELETED,
      new CrmEvent(CrmEventType.ORGANIZATION_DELETED, { organizationId: id }),
      { tenantId }
    );

    return organization;
  }

  async getOrganization(id: string) {
    const tenantId = this.tenantContext.resolveTenantId(id);
    return this.repository.findById(id, tenantId);
  }

  async listOrganizations(organizationId: string): Promise<CrmDashboardOrganizationDto[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const orgs = await this.repository.findAll(tenantId);
    return orgs.map((org) => {
      // Find contact with latest createdAt
      const contacts = org.contacts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const primaryContact = contacts[0];

      // Find latest activity across all contacts
      let latestActivityDate: Date | null = null;
      for (const contact of org.contacts) {
        if (contact.activities.length > 0) {
          const activityDate = new Date(contact.activities[0].createdAt);
          if (!latestActivityDate || activityDate > latestActivityDate) {
            latestActivityDate = activityDate;
          }
        }
      }

      return {
        id: org.id,
        name: org.name,
        industry: org.industry,
        status: org.status,
        contactPerson: primaryContact 
          ? `${primaryContact.firstName} ${primaryContact.lastName}` 
          : 'N/A',
        email: primaryContact?.email ?? 'N/A',
        lastActivity: latestActivityDate 
          ? this.formatDate(latestActivityDate) 
          : 'No activity',
      };
    });
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  async searchOrganizations(organizationId: string, query: string) {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.repository.search(tenantId, query);
  }
}
