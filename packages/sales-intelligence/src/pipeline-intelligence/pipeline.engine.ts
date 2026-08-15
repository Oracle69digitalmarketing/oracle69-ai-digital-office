import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { AiModelProvider } from '../models/ai-model.interface.js';
import { SalesIntelligenceEventType, SalesIntelligenceEvent } from '../events/sales-intelligence.events.js';

export interface PipelineIntelligence {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  stageDistribution: Record<string, number>;
  conversionRate: number;
  winRate: number;
  avgDealVelocity: string;
  anomalies: string[];
  riskConcentration: 'low' | 'medium' | 'high';
}

@Injectable()
export class PipelineIntelligenceEngine {
  private readonly logger = new Logger(PipelineIntelligenceEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  async getPipelineIntelligence(): Promise<PipelineIntelligence | null> {
    const organizationId = this.tenantContext.resolveTenantId();
    this.logger.log(`Analyzing pipeline for organization: ${organizationId}`);

    const opportunities = await this.prisma.crmOpportunity.findMany({
      where: { organizationId },
      include: { pipeline: true },
    });

    const aiInstruction = `
      Analyze this set of sales opportunities as a collective pipeline.
      Detect anomalies, bottlenecks, and risk concentrations.
      Return JSON: { "totalPipelineValue": number, "weightedPipelineValue": number, "stageDistribution": { "stageName": count }, "conversionRate": number, "winRate": number, "avgDealVelocity": "low|medium|high", "anomalies": ["string"], "riskConcentration": "low|medium|high" }
    `;

    try {
      const response = await this.modelProvider.analyze(opportunities, aiInstruction);
      const result: PipelineIntelligence = JSON.parse(response.content.replace(/```json/g, '').replace(/```/g, ''));

      if (result.anomalies.length > 0) {
        this.messageBus.publish(
          SalesIntelligenceEventType.PIPELINE_ANOMALY_DETECTED,
          new SalesIntelligenceEvent(SalesIntelligenceEventType.PIPELINE_ANOMALY_DETECTED, {
            organizationId,
            anomalies: result.anomalies,
            tenantId: organizationId
          })
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to analyze pipeline for organization ${organizationId} via AI:`, error);
      return null;
    }
  }
}
