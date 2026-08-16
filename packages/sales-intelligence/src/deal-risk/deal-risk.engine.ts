import { Injectable, Logger } from "@nestjs/common";
import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { AiModelProvider } from "../models/ai-model.interface.js";
import {
  SalesIntelligenceEventType,
  SalesIntelligenceEvent,
} from "../events/sales-intelligence.events.js";

export interface DealRisk {
  riskType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  evidence: string[];
  recommendedAction: string;
}

@Injectable()
export class DealRiskEngine {
  private readonly logger = new Logger(DealRiskEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async detectRisks(opportunityId: string): Promise<DealRisk[] | null> {
    this.logger.log(`Detecting risks for opportunity: ${opportunityId}`);

    const opportunity = await this.prisma.crmOpportunity.findUnique({
      where: {
        id: opportunityId,
        organizationId: this.tenantContext.resolveTenantId(),
      },
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 10 },
        notes: true,
        contacts: true,
      },
    });

    if (!opportunity) return null;

    const aiInstruction = `
      Identify risks for this sales opportunity.
      Look for: stalled stages, inactive communication, missing decision makers, competitive mentions.
      Return JSON: { "risks": [ { "riskType": "string", "severity": "low|medium|high|critical", "confidence": number, "evidence": ["string"], "recommendedAction": "string" } ] }
    `;

    try {
      const response = await this.modelProvider.analyze(opportunity, aiInstruction);
      const data = JSON.parse(response.content.replace(/```json/g, "").replace(/```/g, ""));
      const risks: DealRisk[] = data.risks || [];

      if (risks.length > 0) {
        this.messageBus.publish(
          SalesIntelligenceEventType.DEAL_RISK_DETECTED,
          new SalesIntelligenceEvent(SalesIntelligenceEventType.DEAL_RISK_DETECTED, {
            opportunityId,
            risks,
            tenantId: this.tenantContext.resolveTenantId(),
          }),
        );
      }

      return risks;
    } catch (error) {
      this.logger.error(`Failed to detect risks for opportunity ${opportunityId} via AI:`, error);
      return null;
    }
  }
}
