import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCrmLeadDto, UpdateCrmLeadDto } from '../dto/crm.dto.js';

@Injectable()
export class CrmLeadRepository {
  private prisma = new PrismaClient();

  async create(data: CreateCrmLeadDto) {
    return this.prisma.crmLead.create({
      data,
    });
  }

  async update(id: string, data: UpdateCrmLeadDto) {
    return this.prisma.crmLead.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.crmLead.delete({
      where: { id },
    });
  }

  async findById(id: string) {
    return this.prisma.crmLead.findUnique({
      where: { id },
      include: {
        crmOrganization: true,
        owner: true,
        activities: true,
        notes: true,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.crmLead.findMany({
      where: { organizationId },
      include: {
        crmOrganization: true,
      },
    });
  }
}
