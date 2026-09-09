import { Module } from "@nestjs/common";
import { AgentsService } from "./agents.service.js";
import { AgentsController } from "./agents.controller.js";
import { AgentEngineModule } from "@oracle69/agent-engine";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";

@Module({
  imports: [AgentEngineModule, PrismaModule, SharedModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
