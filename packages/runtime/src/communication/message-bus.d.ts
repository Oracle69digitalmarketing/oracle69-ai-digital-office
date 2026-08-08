import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MessageBus {
    private readonly eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    publish(event: string, payload: any): void;
}
//# sourceMappingURL=message-bus.d.ts.map