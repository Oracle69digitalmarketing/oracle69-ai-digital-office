import { Injectable, Logger, BadRequestException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventBus } from "@oracle69/shared";
import { TenantContextService } from "@oracle69/runtime";
import { DEFAULT_ACTIVITY_FEED_LIMIT, MAX_ACTIVITY_FEED_LIMIT } from "./dto/activity.dto.js";

@Injectable()
export class ActivityService implements OnModuleInit {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
  }

  onModuleInit() {
    this.eventBus.allEvents().subscribe(async (event) => {
      this.logger.debug(`Capturing activity: ${event.type} from ${event.source}`);

      const payload = event.payload as Record<string, any> | undefined;
      const organizationId = payload?.organizationId;
      if (!organizationId) {
        this.logger.warn(`Event ${event.type} has no organizationId in payload, skipping audit log`);
        return;
      }

      try {
        await this.prisma.auditLog.create({
          data: {
            action: event.type,
            resource: event.source,
            status: "EVENT",
            userId: payload?.userId || null,
            organizationId,
            // We can store the whole payload as a string or handle specific fields
            ipAddress: JSON.stringify(payload).substring(0, 255),
            createdAt: event.timestamp || new Date(),
          },
        });
      } catch (error: any) {
        this.logger.error(`Failed to log activity: ${error.message}`);
      }
    });
  }

  async getFeed(limit?: number) {
    const parsed = limit === undefined ? DEFAULT_ACTIVITY_FEED_LIMIT : Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException("Invalid activity feed limit");
    }
    const take = Math.min(parsed, MAX_ACTIVITY_FEED_LIMIT);

    return this.prisma.auditLog.findMany({
      where: {
        organizationId: this.organizationId,
      },
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
