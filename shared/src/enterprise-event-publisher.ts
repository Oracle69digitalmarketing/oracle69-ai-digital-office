import { Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { Redis } from "ioredis";
import { EventBus } from "./event-bus.js";
import { DomainEvent } from "./types.js";
import { EnterpriseEvent, EventCatalog } from "@oracle69/platform-contracts";

@Injectable()
export class EnterpriseEventPublisher implements OnModuleInit {
  private readonly logger = new Logger(EnterpriseEventPublisher.name);
  private redis: Redis | null = null;
  private readonly streamKey = "oracle69:enterprise_events";
  private readonly enabledEvents: EventCatalog[] = [
    "task.delegated",
    "task.escalated",
    "task.completed",
    "department.handoff",
    "agent.registered",
    "agent.status_changed",
  ];

  constructor(
    private readonly eventBus: EventBus,
    @Optional() private readonly redisOptions?: { url: string; organizationId?: string },
  ) {}

  onModuleInit() {
    if (this.redisOptions?.url) {
      try {
        this.redis = new Redis(this.redisOptions.url);
        this.logger.log("EnterpriseEventPublisher initialized with Redis");

        this.eventBus.allEvents().subscribe(async (event) => {
          if (this.enabledEvents.includes(event.type)) {
            await this.publishToStream(event);
          }
        });
      } catch (error) {
        this.logger.error("Failed to initialize Redis for EnterpriseEventPublisher", error);
      }
    } else {
      this.logger.warn("EnterpriseEventPublisher not configured, skipping Redis stream publishing");
    }
  }

  private async publishToStream(event: DomainEvent) {
    if (!this.redis) return;

    try {
      const enterpriseEvent: EnterpriseEvent = {
        eventId: event.eventId,
        timestamp: event.timestamp,
        type: event.type,
        payload: event.payload,
        source: event.source,
        organizationId: this.redisOptions?.organizationId || "system",
      };

      await this.redis.xadd(this.streamKey, "*", "event", JSON.stringify(enterpriseEvent));

      this.logger.debug(`Forwarded event to Redis Stream: ${event.type}`);
    } catch (error) {
      this.logger.error(`Error publishing to Redis Stream: ${event.type}`, error);
    }
  }
}
