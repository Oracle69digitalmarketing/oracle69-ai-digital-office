import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { validateConfig } from "./config/config.validation.js";
import { JwtAuthGuard } from "./auth/jwt-auth.guard.js";
import { TenantContextInterceptor } from "./common/interceptors/tenant-context.interceptor.js";
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
import { RuntimeModule } from "@oracle69/runtime";
import { SharedModule } from "@oracle69/shared";
import { FinancialIntelligenceModule } from "@oracle69/financial-intelligence";
import { HrIntelligenceModule } from "@oracle69/hr-intelligence";
import { KnowledgeIntelligenceModule } from "@oracle69/knowledge-intelligence";
import { ProcurementIntelligenceModule } from "@oracle69/procurement-intelligence";
import { TasksModule } from "./tasks/tasks.module.js";
import { ActivityModule } from "./activity/activity.module.js";
import { AgentsModule } from "./agents/agents.module.js";
import { WorkflowsModule } from "./workflows/workflows.module.js";
import { PlatformModule } from "./platform/platform.module.js";
import { EiModule } from "./ei/ei.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { DepartmentsModule } from "./departments/departments.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { CrmModule } from "@oracle69/crm";
import { CalendarModule } from "./calendar/calendar.module.js";
import { DashboardModule } from "./dashboard/dashboard.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { ReceptionistModule } from "./receptionist/receptionist.module.js";
import { CustomerSuccessModule } from "@oracle69/customer-success";
import { KnowledgeIndexingSubscriber } from "./automation/knowledge-indexing.subscriber.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AgentEngineModule,
    MemoryModule,
    ExecutionEngineModule,
    RuntimeModule,
    SharedModule,
    FinancialIntelligenceModule,
    HrIntelligenceModule,
    KnowledgeIntelligenceModule,
    ProcurementIntelligenceModule,
    TasksModule,
    ActivityModule,
    AgentsModule,
    WorkflowsModule,
    PlatformModule,
    EiModule,
    ProjectsModule,
    DepartmentsModule,
    DocumentsModule,
    AnalyticsModule,
    CrmModule,
    CalendarModule,
    DashboardModule,
    SettingsModule,
    ReceptionistModule,
    CustomerSuccessModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    KnowledgeIndexingSubscriber,
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
