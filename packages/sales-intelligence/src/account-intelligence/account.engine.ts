import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { AiModelProvider } from '../models/ai-model.interface.js';
import { SalesIntelligenceEventType, SalesIntelligenceEvent } from '../events/sales-intelligence.events.js';

export interface Account360 {
  healthScore: number;
  revenuePotential: number;
  relationshipStrength: string;
  risks: string[];
  growthOpportunities: string[];
  recommendedActions: string[];
  summary: string;
}

@Injectable()
export class AccountIntelligenceEngine {
  private readonly logger = new Logger(AccountIntelligenceEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  async getAccount360(accountId: string): Promise<Account360 | null> {
    this.logger.log(`Generating Account 360 for account: ${accountId}`);

    const account = await this.prisma.crmOrganization.findUnique({
      where: {
        id: accountId,
        organizationId: this.tenantContext.resolveTenantId()
      },
      include: {
        contacts: true,
        opportunities: true,
        leads: true,
        notes: true,
      },
    });

    if (!account) return null;

    const aiInstruction = `
      Provide a 360-degree intelligence view for this account.
      Calculate health score (0-100), revenue potential, and relationship strength.
      Identify risks and growth opportunities.
      Return JSON: { "healthScore": number, "revenuePotential": number, "relationshipStrength": "low|medium|high", "risks": ["string"], "growthOpportunities": ["string"], "recommendedActions": ["string"], "summary": "string" }
    `;

    try {
      const response = await this.modelProvider.analyze(account, aiInstruction);
      const result: Account360 = JSON.parse(response.content.replace(/```json/g, '').replace(/```/g, ''));

      this.messageBus.publish(
        SalesIntelligenceEventType.ACCOUNT_HEALTH_CHANGED,
        new SalesIntelligenceEvent(SalesIntelligenceEventType.ACCOUNT_HEALTH_CHANGED, {
          accountId,
          healthScore: result.healthScore,
          tenantId: this.tenantContext.resolveTenantId()
        })
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate Account 360 for account ${accountId} via AI:`, error);
      return null;
    }
  }
}
