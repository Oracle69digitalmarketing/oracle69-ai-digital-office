import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { UsersModule } from "./users/users.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { HealthController } from "./health/health.controller.js";
import { LoggerMiddleware } from "./common/middleware/logger.middleware.js";
import { AgentEngineModule } from "@oracle69/agent-engine";
import { MemoryModule } from "@oracle69/memory";
import { ExecutionEngineModule } from "@oracle69/execution-engine";
import { SharedModule } from "@oracle69/shared";
import { TasksModule } from "./tasks/tasks.module.js";
import { ActivityModule } from "./activity/activity.module.js";
import { AgentsModule } from "./agents/agents.module.js";
import { WorkflowsModule } from "./workflows/workflows.module.js";
import { CoreAgentsRegistrationService } from "./common/services/core-agents-registration.service.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AgentEngineModule,
    MemoryModule,
    ExecutionEngineModule,
    SharedModule,
    TasksModule,
    ActivityModule,
    AgentsModule,
    WorkflowsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, CoreAgentsRegistrationService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
