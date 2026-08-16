var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EnterpriseEventPublisher_1;
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EventBus } from './event-bus.js';
let EnterpriseEventPublisher = EnterpriseEventPublisher_1 = class EnterpriseEventPublisher {
    eventBus;
    redisOptions;
    logger = new Logger(EnterpriseEventPublisher_1.name);
    redis = null;
    streamKey = 'oracle69:enterprise_events';
    enabledEvents = [
        'task.delegated',
        'task.escalated',
        'task.completed',
        'department.handoff',
        'agent.registered',
        'agent.status_changed',
    ];
    constructor(eventBus, redisOptions) {
        this.eventBus = eventBus;
        this.redisOptions = redisOptions;
    }
    onModuleInit() {
        if (this.redisOptions?.url) {
            try {
                this.redis = new Redis(this.redisOptions.url);
                this.logger.log('EnterpriseEventPublisher initialized with Redis');
                this.eventBus.allEvents().subscribe(async (event) => {
                    if (this.enabledEvents.includes(event.type)) {
                        await this.publishToStream(event);
                    }
                });
            }
            catch (error) {
                this.logger.error('Failed to initialize Redis for EnterpriseEventPublisher', error);
            }
        }
        else {
            this.logger.warn('EnterpriseEventPublisher not configured, skipping Redis stream publishing');
        }
    }
    async publishToStream(event) {
        if (!this.redis)
            return;
        try {
            const enterpriseEvent = {
                eventId: event.eventId,
                timestamp: event.timestamp,
                type: event.type,
                payload: event.payload,
                source: event.source,
                organizationId: this.redisOptions?.organizationId || 'system',
            };
            await this.redis.xadd(this.streamKey, '*', 'event', JSON.stringify(enterpriseEvent));
            this.logger.debug(`Forwarded event to Redis Stream: ${event.type}`);
        }
        catch (error) {
            this.logger.error(`Error publishing to Redis Stream: ${event.type}`, error);
        }
    }
};
EnterpriseEventPublisher = EnterpriseEventPublisher_1 = __decorate([
    Injectable(),
    __param(1, Optional()),
    __metadata("design:paramtypes", [EventBus, Object])
], EnterpriseEventPublisher);
export { EnterpriseEventPublisher };
