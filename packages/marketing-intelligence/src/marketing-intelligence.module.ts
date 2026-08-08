import { Module, Global } from '@nestjs/common';
import { RuntimeModule, MemoryManager, MessageBus, MissionManager } from '@oracle69/runtime';
import { CrmModule } from '@oracle69/crm';
import { SalesIntelligenceModule } from '@oracle69/sales-intelligence';
import { MarketingIntelligenceController } from './controllers/mi.controller.js';
import { MiCampaignEngine } from './services/mi-campaign.engine.js';
import { MiSeoEngine } from './services/mi-seo.engine.js';
import { MiConversionEngine } from './services/mi-conversion.engine.js';
import { MiLeadScoreEngine } from './services/mi-lead-score.engine.js';
import { MiGrowthInsightEngine } from './services/mi-growth-insight.engine.js';
import { MiReportService } from './services/mi-report.service.js';

@Global()
@Module({
  imports: [RuntimeModule, CrmModule, SalesIntelligenceModule],
  controllers: [MarketingIntelligenceController],
  providers: [
    MiCampaignEngine,
    MiSeoEngine,
    MiConversionEngine,
    MiLeadScoreEngine,
    {
      provide: MiGrowthInsightEngine,
      useFactory: (
        provider: any,
        campaign: MiCampaignEngine,
        seo: MiSeoEngine,
        conversion: MiConversionEngine,
        bus: MessageBus,
        memory: MemoryManager
      ) => new MiGrowthInsightEngine(provider, campaign, seo, conversion, bus, memory),
      inject: ['AiModelProvider', MiCampaignEngine, MiSeoEngine, MiConversionEngine, MessageBus, MemoryManager],
    },
    MiReportService,
  ],
  exports: [
    MiCampaignEngine,
    MiSeoEngine,
    MiConversionEngine,
    MiLeadScoreEngine,
    MiGrowthInsightEngine,
    MiReportService,
  ],
})
export class MarketingIntelligenceModule {}
