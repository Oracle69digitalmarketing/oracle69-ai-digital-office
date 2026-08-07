import { OnModuleInit } from '@nestjs/common';
import { EventBus } from './event-bus.js';
export declare class EnterpriseEventPublisher implements OnModuleInit {
    private readonly eventBus;
    private readonly redisOptions?;
    private readonly logger;
    private redis;
    private readonly streamKey;
    private readonly enabledEvents;
    constructor(eventBus: EventBus, redisOptions?: {
        url: string;
        organizationId?: string;
    } | undefined);
    onModuleInit(): void;
    private publishToStream;
}
//# sourceMappingURL=enterprise-event-publisher.d.ts.map