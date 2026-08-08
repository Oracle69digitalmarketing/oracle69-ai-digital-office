import { Injectable } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { CrmActivityRepository } from '../repositories/crm-activity.repository.js';
import { CreateCrmActivityDto, UpdateCrmActivityDto, CreateCrmNoteDto, UpdateCrmNoteDto } from '../dto/crm.dto.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmActivityService {
  constructor(
    private readonly repository: CrmActivityRepository,
    private readonly messageBus: MessageBus
  ) {}

  // Activity Methods
  async createActivity(data: CreateCrmActivityDto) {
    const activity = await this.repository.createActivity(data);
    
    this.messageBus.publish(
      CrmEventType.ACTIVITY_CREATED,
      new CrmEvent(CrmEventType.ACTIVITY_CREATED, { activity })
    );

    return activity;
  }

  async updateActivity(id: string, data: UpdateCrmActivityDto) {
    const activity = await this.repository.updateActivity(id, data);

    if (data.status === 'completed') {
      this.messageBus.publish(
        CrmEventType.ACTIVITY_COMPLETED,
        new CrmEvent(CrmEventType.ACTIVITY_COMPLETED, { activityId: id })
      );
    } else if (data.status === 'cancelled') {
      this.messageBus.publish(
        CrmEventType.ACTIVITY_CANCELLED,
        new CrmEvent(CrmEventType.ACTIVITY_CANCELLED, { activityId: id })
      );
    }

    return activity;
  }

  async deleteActivity(id: string) {
    return this.repository.deleteActivity(id);
  }

  async getActivity(id: string) {
    return this.repository.findActivityById(id);
  }

  async listActivities(organizationId: string) {
    return this.repository.findActivitiesByOrganization(organizationId);
  }

  // Note Methods
  async createNote(data: CreateCrmNoteDto) {
    return this.repository.createNote(data);
  }

  async updateNote(id: string, data: UpdateCrmNoteDto) {
    return this.repository.updateNote(id, data);
  }

  async deleteNote(id: string) {
    return this.repository.deleteNote(id);
  }
}
