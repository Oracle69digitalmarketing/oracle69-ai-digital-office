import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCrmOrganizationDto, UpdateCrmOrganizationDto } from '../dto/crm.dto.js';

@Injectable()
export class CrmOrganizationRepository {
  private prisma = new PrismaClient();

  async create(data: CreateCrmOrganizationDto) {
    return this.prisma.crmOrganization.create({
      data,
    });
  }

  async update(id: string, data: UpdateCrmOrganizationDto) {
    return this.prisma.crmOrganization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.crmOrganization.delete({
      where: { id },
    });
  }

  async findById(id: string) {
    return this.prisma.crmOrganization.findUnique({
      where: { id },
      include: {
        contacts: true,
        opportunities: true,
        leads: true,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.crmOrganization.findMany({
      where: { organizationId },
    });
  }

  async search(organizationId: string, query: string) {
    return this.prisma.crmOrganization.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { industry: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }
}
