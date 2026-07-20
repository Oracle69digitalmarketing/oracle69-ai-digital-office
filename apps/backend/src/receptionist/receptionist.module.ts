import { Module } from "@nestjs/common";
import { ReceptionistService } from "./receptionist.service.js";
import { ReceptionistController } from "./receptionist.controller.js";
import { AgentEngineModule } from "@oracle69/agent-engine";
import { MemoryModule } from "@oracle69/memory";
import { ExecutionEngineModule } from "@oracle69/execution-engine";

@Module({
  imports: [AgentEngineModule, MemoryModule, ExecutionEngineModule],
  controllers: [ReceptionistController],
  providers: [ReceptionistService],
})
export class ReceptionistModule {}
