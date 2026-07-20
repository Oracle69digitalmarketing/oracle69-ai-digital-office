import { Module, Global } from '@nestjs/common';
import { EventBus } from './event-bus.js';

@Global()
@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class SharedModule {}
