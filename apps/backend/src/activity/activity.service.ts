import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventBus } from "@oracle69/shared";

@Injectable()
export class ActivityService implements OnModuleInit {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
  ) {}

  onModuleInit() {
    this.eventBus.allEvents().subscribe(async (event) => {
      this.logger.debug(`Capturing activity: ${event.type} from ${event.source}`);

      try {
        await this.prisma.auditLog.create({
          data: {
            action: event.type,
            resource: event.source,
            status: "EVENT",
            userId: (event.payload as any)?.userId || null,
            // We can store the whole payload as a string or handle specific fields
            ipAddress: JSON.stringify(event.payload).substring(0, 255),
            createdAt: event.timestamp || new Date(),
          },
        });
      } catch (error: any) {
        this.logger.error(`Failed to log activity: ${error.message}`);
      }
    });
  }

  async getFeed(limit = 50) {
    return this.prisma.auditLog.findMany({
      take: limit,
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
