import { Module } from "@nestjs/common";
import { PlatformController } from "./platform.controller.js";
import { PlatformAuthGuard } from "./platform-auth.guard.js";
import { PlatformApiKeyService } from "./platform-api-key.service.js";
import { AgentEngineModule } from "@oracle69/agent-engine";
import { MemoryModule } from "@oracle69/memory";
import { ExecutionEngineModule } from "@oracle69/execution-engine";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
  imports: [AgentEngineModule, MemoryModule, ExecutionEngineModule, PrismaModule],
  controllers: [PlatformController],
  providers: [PlatformAuthGuard, PlatformApiKeyService],
  exports: [PlatformApiKeyService, PlatformAuthGuard],
})
export class PlatformModule {}
