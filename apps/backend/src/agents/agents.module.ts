import { Module } from "@nestjs/common";
import { AgentsService } from "./agents.service.js";
import { AgentsController } from "./agents.controller.js";
import { AgentEngineModule } from "@oracle69/agent-engine";

@Module({
  imports: [AgentEngineModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
