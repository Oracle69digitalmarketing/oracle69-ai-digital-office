import { Module, Global } from '@nestjs/common';
import { RuntimeModule, MemoryManager, MissionManager, MessageBus } from '@oracle69/runtime';
import { CrmModule } from '@oracle69/crm';
import { SalesIntelligenceController } from './controllers/sales-intelligence.controller.js';
import { SalesIntelligenceService } from './services/sales-intelligence.service.js';
import { LeadScoringEngine } from './lead-scoring/lead-scoring.engine.js';
import { OpportunityEngine } from './opportunity-scoring/opportunity.engine.js';
import { DealRiskEngine } from './deal-risk/deal-risk.engine.js';
import { ForecastingEngine } from './forecasting/forecasting.engine.js';
import { NextBestActionEngine } from './next-best-action/nba.engine.js';
import { AccountIntelligenceEngine } from './account-intelligence/account.engine.js';
import { PipelineIntelligenceEngine } from './pipeline-intelligence/pipeline.engine.js';
import { RelationshipIntelligenceEngine } from './relationship-intelligence/relationship.engine.js';
import { CustomerSignalEngine } from './customer-signals/signal.engine.js';
import { ExecutiveIntelligenceEngine } from './executive-intelligence/executive.engine.js';
import { GeminiModelProvider } from './models/gemini-model.provider.js';
import { AiModelProvider } from './models/ai-model.interface.js';

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
      provide: 'AiModelProvider',
      useFactory: () => {
        const apiKey = process.env.GOOGLE_AI_API_KEY || '';
        return new GeminiModelProvider(apiKey);
      },
    },
    {
        provide: SalesIntelligenceService,
        useFactory: (ls, oe, dr, fc, nba, ae, pe, re, cs, ee, mem, mm) => 
            new SalesIntelligenceService(ls, oe, dr, fc, nba, ae, pe, re, cs, ee, mem, mm),
        inject: [
            LeadScoringEngine, OpportunityEngine, DealRiskEngine, ForecastingEngine, 
            NextBestActionEngine, AccountIntelligenceEngine, PipelineIntelligenceEngine, 
            RelationshipIntelligenceEngine, CustomerSignalEngine, ExecutiveIntelligenceEngine,
            MemoryManager, MissionManager
        ]
    },
    // Override engines to inject interface implementation
    {
        provide: LeadScoringEngine,
        useFactory: (provider: AiModelProvider, bus: MessageBus) => new LeadScoringEngine(provider, bus),
        inject: ['AiModelProvider', MessageBus]
    },
    {
        provide: OpportunityEngine,
        useFactory: (provider: AiModelProvider, bus: MessageBus) => new OpportunityEngine(provider, bus),
        inject: ['AiModelProvider', MessageBus]
    },
    {
        provide: DealRiskEngine,
        useFactory: (provider: AiModelProvider, bus: MessageBus) => new DealRiskEngine(provider, bus),
        inject: ['AiModelProvider', MessageBus]
    },
    {
        provide: NextBestActionEngine,
        useFactory: (provider: AiModelProvider, bus: MessageBus) => new NextBestActionEngine(provider, bus),
        inject: ['AiModelProvider', MessageBus]
    },
    {
        provide: AccountIntelligenceEngine,
        useFactory: (provider: AiModelProvider, bus: MessageBus) => new AccountIntelligenceEngine(provider, bus),
        inject: ['AiModelProvider', MessageBus]
    },
    {
        provide: PipelineIntelligenceEngine,
        useFactory: (provider: AiModelProvider, bus: MessageBus) => new PipelineIntelligenceEngine(provider, bus),
        inject: ['AiModelProvider', MessageBus]
    },
    {
        provide: ExecutiveIntelligenceEngine,
        useFactory: (provider: AiModelProvider, bus: MessageBus) => new ExecutiveIntelligenceEngine(provider, bus),
        inject: ['AiModelProvider', MessageBus]
    },
    {
        provide: RelationshipIntelligenceEngine,
        useFactory: (provider: AiModelProvider) => new RelationshipIntelligenceEngine(provider),
        inject: ['AiModelProvider']
    }
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
  ],
})
export class SalesIntelligenceModule {}
