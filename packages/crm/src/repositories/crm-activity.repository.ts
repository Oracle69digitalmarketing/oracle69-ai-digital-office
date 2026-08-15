import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCrmActivityDto, UpdateCrmActivityDto, CreateCrmNoteDto, UpdateCrmNoteDto } from '../dto/crm.dto.js';

@Injectable()
export class CrmActivityRepository {
  private prisma = new PrismaClient();

  // Activity CRUD
  async createActivity(data: CreateCrmActivityDto & { organizationId: string }) {
    return this.prisma.crmActivity.create({
      data,
    });
  }

  async updateActivity(id: string, organizationId: string, data: UpdateCrmActivityDto) {
    const record = await this.prisma.crmActivity.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmActivity.update({
      where: { id },
      data,
    });
  }

  async deleteActivity(id: string, organizationId: string) {
    const record = await this.prisma.crmActivity.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmActivity.delete({
      where: { id },
    });
  }

  async findActivityById(id: string, organizationId: string) {
    return this.prisma.crmActivity.findFirst({
      where: { id, organizationId },
      include: {
        crmContact: true,
        crmLead: true,
        crmOpportunity: true,
        assignedTo: true,
        notes: true,
      },
    });
  }

  async findActivitiesByOrganization(organizationId: string) {
    return this.prisma.crmActivity.findMany({
      where: { organizationId },
      include: {
        crmContact: true,
        crmLead: true,
        crmOpportunity: true,
      },
    });
  }

  // Note CRUD
  async createNote(data: CreateCrmNoteDto & { organizationId: string }) {
    // Remove organizationId from data if it's not in the model
    const { organizationId, ...rest } = data;
    return this.prisma.crmNote.create({
      data: rest,
    });
  }

  async updateNote(id: string, organizationId: string, data: UpdateCrmNoteDto) {
    // Find note where it's linked to an entity in this organization
    const record = await this.prisma.crmNote.findFirst({ 
      where: { 
        id, 
        OR: [
          { crmOrganization: { organizationId } },
          { crmContact: { organizationId } },
          { crmLead: { organizationId } },
          { crmOpportunity: { organizationId } },
          { crmActivity: { organization: { id: organizationId } } }
        ]
      } 
    });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmNote.update({
      where: { id },
      data,
    });
  }

  async deleteNote(id: string, organizationId: string) {
    const record = await this.prisma.crmNote.findFirst({ 
      where: { 
        id, 
        OR: [
          { crmOrganization: { organizationId } },
          { crmContact: { organizationId } },
          { crmLead: { organizationId } },
          { crmOpportunity: { organizationId } },
          { crmActivity: { organization: { id: organizationId } } }
        ]
      } 
    });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmNote.delete({
      where: { id },
    });
  }
}
