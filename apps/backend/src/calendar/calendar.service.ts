import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId() {
    return this.tenantContext.getTenantId();
  }

  async findAll() {
    return this.prisma.calendarEvent.findMany({
      where: { organizationId: this.organizationId },
    });
  }

  async create(data: any) {
    return this.prisma.calendarEvent.create({
      data: {
        ...data,
        organizationId: this.organizationId,
      },
    });
  }
}
