import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { AiModelProvider } from '../models/ai-model.interface.js';
import { SalesIntelligenceEventType, SalesIntelligenceEvent } from '../events/sales-intelligence.events.js';

export interface NextBestAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  expectedOutcome: string;
  confidence: number;
}

@Injectable()
export class NextBestActionEngine {
  private readonly logger = new Logger(NextBestActionEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  async recommendNextAction(entityType: 'lead' | 'opportunity' | 'account', entityId: string): Promise<NextBestAction | null> {
    this.logger.log(`Generating NBA for ${entityType}: ${entityId}`);

    let entityData: any;
    const organizationId = this.tenantContext.resolveTenantId();

    if (entityType === 'lead') {
      entityData = await this.prisma.crmLead.findFirst({ where: { id: entityId, organizationId }, include: { activities: true, notes: true } });
    } else if (entityType === 'opportunity') {
      entityData = await this.prisma.crmOpportunity.findFirst({ where: { id: entityId, organizationId }, include: { activities: true, notes: true, contacts: true } });
    } else if (entityType === 'account') {
      entityData = await this.prisma.crmOrganization.findFirst({ where: { id: entityId, organizationId }, include: { contacts: true, opportunities: true, notes: true } });
    }

    if (!entityData) return null;

    const aiInstruction = `
      Determine the single best next action for this ${entityType}.
      Return JSON: { "action": "string", "priority": "low|medium|high|urgent", "reason": "string", "expectedOutcome": "string", "confidence": number }
    `;

    try {
      const response = await this.modelProvider.analyze(entityData, aiInstruction);
      const nba: NextBestAction = JSON.parse(response.content.replace(/```json/g, '').replace(/```/g, ''));

      this.messageBus.publish(
        SalesIntelligenceEventType.NEXT_BEST_ACTION_GENERATED,
        new SalesIntelligenceEvent(SalesIntelligenceEventType.NEXT_BEST_ACTION_GENERATED, {
          entityType,
          entityId,
          nba,
          tenantId: organizationId
        })
      );

      return nba;
    } catch (error) {
      this.logger.error(`Failed to generate NBA for ${entityType} ${entityId} via AI:`, error);
      return null;
    }
  }
}
