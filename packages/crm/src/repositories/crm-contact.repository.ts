import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { CreateCrmContactDto, UpdateCrmContactDto } from "../dto/crm.dto.js";

@Injectable()
export class CrmContactRepository {
  private prisma = new PrismaClient();

  async create(data: CreateCrmContactDto & { organizationId: string }) {
    return this.prisma.crmContact.create({
      data,
    });
  }

  async update(id: string, organizationId: string, data: UpdateCrmContactDto) {
    const record = await this.prisma.crmContact.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error("Not found or access denied");
    return this.prisma.crmContact.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const record = await this.prisma.crmContact.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error("Not found or access denied");
    return this.prisma.crmContact.delete({
      where: { id },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.crmContact.findFirst({
      where: { id, organizationId },
      include: {
        crmOrganization: true,
        owner: true,
        activities: true,
        notes: true,
        opportunities: true,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.crmContact.findMany({
      where: { organizationId },
      include: {
        crmOrganization: true,
      },
    });
  }

  async search(organizationId: string, query: string) {
    return this.prisma.crmContact.findMany({
      where: {
        organizationId,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
    });
  }
}
