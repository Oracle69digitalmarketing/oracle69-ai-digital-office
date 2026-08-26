import { Injectable } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";
import { CreateCrmOrganizationDto, UpdateCrmOrganizationDto } from "../dto/crm.dto.js";

@Injectable()
export class CrmOrganizationRepository {
  private prisma = new PrismaClient();

  async create(data: CreateCrmOrganizationDto & { organizationId: string }) {
    return this.prisma.crmOrganization.create({
      data,
    });
  }

  async update(id: string, organizationId: string, data: UpdateCrmOrganizationDto) {
    const record = await this.prisma.crmOrganization.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error("Not found or access denied");
    return this.prisma.crmOrganization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const record = await this.prisma.crmOrganization.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error("Not found or access denied");
    return this.prisma.crmOrganization.delete({
      where: { id },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.crmOrganization.findFirst({
      where: { id, organizationId },
      include: {
        contacts: true,
        opportunities: true,
        leads: true,
      },
    });
  }

  async findAll(organizationId: string): Promise<Prisma.CrmOrganizationGetPayload<{ include: { contacts: { include: { activities: true } } } }>[]> {
    return this.prisma.crmOrganization.findMany({
      where: { organizationId },
      include: {
        contacts: {
          include: {
            activities: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });
  }

  async search(organizationId: string, query: string) {
    return this.prisma.crmOrganization.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { industry: { contains: query, mode: "insensitive" } },
        ],
      },
    });
  }
}
