import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";
import { CreateCalendarEventDto } from "./dto/calendar.dto.js";

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
  }

  async findAll() {
    return this.prisma.calendarEvent.findMany({
      where: { organizationId: this.organizationId },
    });
  }

  async create(data: CreateCalendarEventDto, userId: string) {
    const orgId = this.organizationId;

    if (!userId || userId.length === 0) {
      throw new NotFoundException("Authenticated user not resolved");
    }

    const start = new Date(data.start);
    const end = new Date(data.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid event start or end timestamp");
    }
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException("Event end must not precede its start");
    }

    return this.prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description ?? undefined,
        start,
        end,
        status: data.status ?? "confirmed",
        ownerId: userId,
        organizationId: orgId,
      },
    });
  }
}
