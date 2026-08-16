import { Module, Global } from "@nestjs/common";
import {
  RuntimeModule,
  MemoryManager,
  MissionManager,
  MessageBus,
  TenantContextService,
} from "@oracle69/runtime";
import { CrmModule } from "@oracle69/crm";
import { SalesIntelligenceController } from "./controllers/sales-intelligence.controller.js";
import { SalesIntelligenceService } from "./services/sales-intelligence.service.js";
import { LeadScoringEngine } from "./lead-scoring/lead-scoring.engine.js";
import { OpportunityEngine } from "./opportunity-scoring/opportunity.engine.js";
import { DealRiskEngine } from "./deal-risk/deal-risk.engine.js";
import { ForecastingEngine } from "./forecasting/forecasting.engine.js";
import { NextBestActionEngine } from "./next-best-action/nba.engine.js";
import { AccountIntelligenceEngine } from "./account-intelligence/account.engine.js";
import { PipelineIntelligenceEngine } from "./pipeline-intelligence/pipeline.engine.js";
import { RelationshipIntelligenceEngine } from "./relationship-intelligence/relationship.engine.js";
import { CustomerSignalEngine } from "./customer-signals/signal.engine.js";
import { ExecutiveIntelligenceEngine } from "./executive-intelligence/executive.engine.js";
import { GeminiModelProvider } from "./models/gemini-model.provider.js";
import { GroqModelProvider } from "./models/groq-model.provider.js";
import { AiModelProvider } from "./models/ai-model.interface.js";

@Global()
@Module({
  imports: [RuntimeModule, CrmModule],
  controllers: [SalesIntelligenceController],
  providers: [
    LeadScoringEngine,
    OpportunityEngine,
    DealRiskEngine,
    ForecastingEngine,
    NextBestActionEngine,
    AccountIntelligenceEngine,
    PipelineIntelligenceEngine,
    RelationshipIntelligenceEngine,
    CustomerSignalEngine,
    ExecutiveIntelligenceEngine,
    {
      provide: "AiModelProvider",
      useFactory: () => {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (groqApiKey) {
          return new GroqModelProvider(groqApiKey);
        }
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
        return new GeminiModelProvider(apiKey);
      },
    },
    {
      provide: SalesIntelligenceService,
      useFactory: (ls, oe, dr, fc, nba, ae, pe, re, cs, ee, mem, mm, tc) =>
        new SalesIntelligenceService(ls, oe, dr, fc, nba, ae, pe, re, cs, ee, mem, mm, tc),
      inject: [
        LeadScoringEngine,
        OpportunityEngine,
        DealRiskEngine,
        ForecastingEngine,
        NextBestActionEngine,
        AccountIntelligenceEngine,
        PipelineIntelligenceEngine,
        RelationshipIntelligenceEngine,
        CustomerSignalEngine,
        ExecutiveIntelligenceEngine,
        MemoryManager,
        MissionManager,
        TenantContextService,
      ],
    },
    // Override engines to inject interface implementation
    {
      provide: LeadScoringEngine,
      useFactory: (provider: AiModelProvider, bus: MessageBus, tc: TenantContextService) =>
        new LeadScoringEngine(provider, bus, tc),
      inject: ["AiModelProvider", MessageBus, TenantContextService],
    },
    {
      provide: OpportunityEngine,
      useFactory: (provider: AiModelProvider, bus: MessageBus, tc: TenantContextService) =>
        new OpportunityEngine(provider, bus, tc),
      inject: ["AiModelProvider", MessageBus, TenantContextService],
    },
    {
      provide: DealRiskEngine,
      useFactory: (provider: AiModelProvider, bus: MessageBus, tc: TenantContextService) =>
        new DealRiskEngine(provider, bus, tc),
      inject: ["AiModelProvider", MessageBus, TenantContextService],
    },
    {
      provide: NextBestActionEngine,
      useFactory: (provider: AiModelProvider, bus: MessageBus, tc: TenantContextService) =>
        new NextBestActionEngine(provider, bus, tc),
      inject: ["AiModelProvider", MessageBus, TenantContextService],
    },
    {
      provide: AccountIntelligenceEngine,
      useFactory: (provider: AiModelProvider, bus: MessageBus, tc: TenantContextService) =>
        new AccountIntelligenceEngine(provider, bus, tc),
      inject: ["AiModelProvider", MessageBus, TenantContextService],
    },
    {
      provide: PipelineIntelligenceEngine,
      useFactory: (provider: AiModelProvider, bus: MessageBus, tc: TenantContextService) =>
        new PipelineIntelligenceEngine(provider, bus, tc),
      inject: ["AiModelProvider", MessageBus, TenantContextService],
    },
    {
      provide: ExecutiveIntelligenceEngine,
      useFactory: (provider: AiModelProvider, bus: MessageBus, tc: TenantContextService) =>
        new ExecutiveIntelligenceEngine(provider, bus, tc),
      inject: ["AiModelProvider", MessageBus, TenantContextService],
    },
    {
      provide: RelationshipIntelligenceEngine,
      useFactory: (provider: AiModelProvider, tc: TenantContextService) =>
        new RelationshipIntelligenceEngine(provider, tc),
      inject: ["AiModelProvider", TenantContextService],
    },
  ],
  exports: [
    SalesIntelligenceService,
    LeadScoringEngine,
    OpportunityEngine,
    DealRiskEngine,
    ForecastingEngine,
    NextBestActionEngine,
    AccountIntelligenceEngine,
    PipelineIntelligenceEngine,
    RelationshipIntelligenceEngine,
    CustomerSignalEngine,
    ExecutiveIntelligenceEngine,
    "AiModelProvider", // Ensure export for DI resolution
  ],
})
export class SalesIntelligenceModule {}
