import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessageBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: string, payload: any): void {
    this.eventEmitter.emit(event, payload);
  }
}
