import { Module, Global } from '@nestjs/common';
import { EventBus } from './event-bus.js';
import { EnterpriseEventPublisher } from './enterprise-event-publisher.js';

@Global()
@Module({
  providers: [EventBus, EnterpriseEventPublisher],
  exports: [EventBus, EnterpriseEventPublisher],
})
export class SharedModule {}
