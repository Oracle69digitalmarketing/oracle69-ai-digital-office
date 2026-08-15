import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCrmLeadDto, UpdateCrmLeadDto } from '../dto/crm.dto.js';

@Injectable()
export class CrmLeadRepository {
  private prisma = new PrismaClient();

  async create(data: CreateCrmLeadDto & { organizationId: string }) {
    return this.prisma.crmLead.create({
      data,
    });
  }

  async update(id: string, organizationId: string, data: UpdateCrmLeadDto) {
    const record = await this.prisma.crmLead.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmLead.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const record = await this.prisma.crmLead.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmLead.delete({
      where: { id },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.crmLead.findFirst({
      where: { id, organizationId },
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
