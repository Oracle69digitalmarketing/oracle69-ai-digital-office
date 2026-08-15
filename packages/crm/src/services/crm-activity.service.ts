import { Injectable } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { CrmActivityRepository } from '../repositories/crm-activity.repository.js';
import { CreateCrmActivityDto, UpdateCrmActivityDto, CreateCrmNoteDto, UpdateCrmNoteDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmActivityService {
  constructor(
    private readonly repository: CrmActivityRepository,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  // Activity Methods
  async createActivity(data: CreateCrmActivityDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const activity = await this.repository.createActivity({ ...data, organizationId: tenantId });
    
    this.messageBus.publish(
      CrmEventType.ACTIVITY_CREATED,
      new CrmEvent(CrmEventType.ACTIVITY_CREATED, { activity }),
      { tenantId }
    );

    return activity;
  }

  async updateActivity(id: string, data: UpdateCrmActivityDto & { organizationId?: string }) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const activity = await this.repository.updateActivity(id, tenantId, data);

    if (data.status === 'completed') {
      this.messageBus.publish(
        CrmEventType.ACTIVITY_COMPLETED,
        new CrmEvent(CrmEventType.ACTIVITY_COMPLETED, { activityId: id }),
        { tenantId }
      );
    } else if (data.status === 'cancelled') {
      this.messageBus.publish(
        CrmEventType.ACTIVITY_CANCELLED,
        new CrmEvent(CrmEventType.ACTIVITY_CANCELLED, { activityId: id }),
        { tenantId }
      );
    }

    return activity;
  }

  async deleteActivity(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.deleteActivity(id, tenantId);
  }

  async getActivity(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.findActivityById(id, tenantId);
  }

  async listActivities(organizationId?: string) {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.repository.findActivitiesByOrganization(tenantId);
  }

  // Note Methods
  async createNote(data: CreateCrmNoteDto) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    return this.repository.createNote({ ...data, organizationId: tenantId });
  }

  async updateNote(id: string, data: UpdateCrmNoteDto & { organizationId?: string }) {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    return this.repository.updateNote(id, tenantId, data);
  }

  async deleteNote(id: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    return this.repository.deleteNote(id, tenantId);
  }
}
