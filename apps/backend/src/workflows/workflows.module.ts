import { Module } from "@nestjs/common";
import { WorkflowsService } from "./workflows.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";
import { ExecutionEngineModule } from "@oracle69/execution-engine";
import { AgentEngineModule } from "@oracle69/agent-engine";

@Module({
  imports: [PrismaModule, SharedModule, ExecutionEngineModule, AgentEngineModule],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
