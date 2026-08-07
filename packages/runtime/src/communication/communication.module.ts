import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentDirectory } from './agent-directory.js';
import { AgentMailbox } from './agent-mailbox.js';
import { MessageRouter } from './message-router.js';
import { MessageBus } from './message-bus.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [AgentDirectory, AgentMailbox, MessageRouter, MessageBus],
  exports: [AgentDirectory, AgentMailbox, MessageRouter, MessageBus],
})
export class CommunicationModule {}
