import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCrmActivityDto, UpdateCrmActivityDto, CreateCrmNoteDto, UpdateCrmNoteDto } from '../dto/crm.dto.js';

@Injectable()
export class CrmActivityRepository {
  private prisma = new PrismaClient();

  // Activity CRUD
  async createActivity(data: CreateCrmActivityDto) {
    return this.prisma.crmActivity.create({
      data,
    });
  }

  async updateActivity(id: string, data: UpdateCrmActivityDto) {
    return this.prisma.crmActivity.update({
      where: { id },
      data,
    });
  }

  async deleteActivity(id: string) {
    return this.prisma.crmActivity.delete({
      where: { id },
    });
  }

  async findActivityById(id: string) {
    return this.prisma.crmActivity.findUnique({
      where: { id },
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
  async createNote(data: CreateCrmNoteDto) {
    return this.prisma.crmNote.create({
      data,
    });
  }

  async updateNote(id: string, data: UpdateCrmNoteDto) {
    return this.prisma.crmNote.update({
      where: { id },
      data,
    });
  }

  async deleteNote(id: string) {
    return this.prisma.crmNote.delete({
      where: { id },
    });
  }
}
