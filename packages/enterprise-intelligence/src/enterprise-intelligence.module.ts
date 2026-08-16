import { Module, Global } from "@nestjs/common";
import { RuntimeModule, MemoryManager, MessageBus } from "@oracle69/runtime";
import { CrmModule } from "@oracle69/crm";
import { SalesIntelligenceModule } from "@oracle69/sales-intelligence";
import { EnterpriseIntelligenceController } from "./controllers/ei.controller.js";
import { EiKpiEngine } from "./services/ei-kpi.engine.js";
import { EiBusinessHealthEngine } from "./services/ei-business-health.engine.js";
import { EiForecastEngine } from "./services/ei-forecast.engine.js";
import { EiScenarioEngine } from "./services/ei-scenario.engine.js";
import { EiInsightEngine } from "./services/ei-insight.engine.js";
import { EiReportService } from "./services/ei-report.service.js";

@Global()
@Module({
  imports: [RuntimeModule, CrmModule, SalesIntelligenceModule],
  controllers: [EnterpriseIntelligenceController],
  providers: [
    EiKpiEngine,
    EiBusinessHealthEngine,
    EiForecastEngine,
    EiScenarioEngine,
    {
      provide: EiInsightEngine,
      useFactory: (
        provider: any,
        kpi: EiKpiEngine,
        health: EiBusinessHealthEngine,
        forecast: EiForecastEngine,
        bus: MessageBus,
        memory: MemoryManager,
      ) => new EiInsightEngine(provider, kpi, health, forecast, bus, memory),
      inject: [
        "AiModelProvider",
        EiKpiEngine,
        EiBusinessHealthEngine,
        EiForecastEngine,
        MessageBus,
        MemoryManager,
      ],
    },
    EiReportService,
  ],
  exports: [
    EiKpiEngine,
    EiBusinessHealthEngine,
    EiForecastEngine,
    EiScenarioEngine,
    EiInsightEngine,
    EiReportService,
  ],
})
export class EnterpriseIntelligenceModule {}
