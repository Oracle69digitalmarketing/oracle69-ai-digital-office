import { Module } from "@nestjs/common";
import { AgentDirectory } from "./agent-directory.js";
import { AgentMailbox } from "./agent-mailbox.js";
import { MessageRouter } from "./message-router.js";
import { MessageBus } from "./message-bus.js";

@Module({
  providers: [AgentDirectory, AgentMailbox, MessageRouter, MessageBus],
  exports: [AgentDirectory, AgentMailbox, MessageRouter, MessageBus],
})
export class CommunicationModule {}
