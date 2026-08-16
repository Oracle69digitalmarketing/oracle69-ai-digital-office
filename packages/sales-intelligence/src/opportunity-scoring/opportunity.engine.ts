import { Injectable, Logger } from "@nestjs/common";
import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { AiModelProvider } from "../models/ai-model.interface.js";
import {
  SalesIntelligenceEventType,
  SalesIntelligenceEvent,
} from "../events/sales-intelligence.events.js";

export interface OpportunityAnalysis {
  opportunityScore: number;
  winProbability: number;
  dealVelocity: string;
  engagementLevel: string;
  expectedCloseProbability: number;
  anomalyDetected: boolean;
  reasoning: string[];
}

@Injectable()
export class OpportunityEngine {
  private readonly logger = new Logger(OpportunityEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async analyzeOpportunity(opportunityId: string): Promise<OpportunityAnalysis | null> {
    this.logger.log(`Analyzing opportunity: ${opportunityId}`);

    const organizationId = this.tenantContext.resolveTenantId();

    const opportunity = await this.prisma.crmOpportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId,
      },
      include: {
        crmOrganization: true,
        pipeline: { include: { stages: true } },
        activities: true,
        notes: true,
        contacts: true,
      },
    });

    if (!opportunity) {
      this.logger.error(`Opportunity not found: ${opportunityId}`);
      return null;
    }

    // AI-enhanced analysis
    const aiInstruction = `
      Analyze this sales opportunity and provide intelligence signals.
      Calculate opportunity score (0-100), win probability (0.0-1.0), and deal velocity.
      Detect any abnormal behavior or risks.
      Return JSON: { "opportunityScore": number, "winProbability": number, "dealVelocity": "low|medium|high", "engagementLevel": "low|medium|high", "expectedCloseProbability": number, "anomalyDetected": boolean, "reasoning": ["string"] }
    `;

    try {
      const response = await this.modelProvider.analyze(opportunity, aiInstruction);
      const result: OpportunityAnalysis = JSON.parse(
        response.content.replace(/```json/g, "").replace(/```/g, ""),
      );

      // Update CRM
      await this.prisma.crmOpportunity.update({
        where: { id: opportunityId },
        data: { probability: result.winProbability },
      });

      // Publish event
      this.messageBus.publish(
        SalesIntelligenceEventType.OPPORTUNITY_SCORED,
        new SalesIntelligenceEvent(SalesIntelligenceEventType.OPPORTUNITY_SCORED, {
          opportunityId,
          ...result,
          tenantId: organizationId,
        }),
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to analyze opportunity ${opportunityId} via AI:`, error);
      return null;
    }
  }
}
