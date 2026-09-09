import { Module } from "@nestjs/common";
import { WorkflowsController } from "./workflows.controller.js";
import { WorkflowsService } from "./workflows.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";
import { ExecutionEngineModule } from "@oracle69/execution-engine";
import { AgentEngineModule } from "@oracle69/agent-engine";
import { RuntimeModule } from "@oracle69/runtime";

@Module({
  imports: [PrismaModule, SharedModule, ExecutionEngineModule, AgentEngineModule, RuntimeModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
