import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '@oracle69/runtime';
import { AiModelProvider } from '../models/ai-model.interface.js';

export interface Stakeholder {
  id: string;
  name: string;
  role: 'decision_maker' | 'influencer' | 'champion' | 'blocker' | 'unknown';
  relationshipStrength: 'weak' | 'neutral' | 'strong';
  lastInteraction: Date | null;
}

export interface RelationshipGap {
  missingRole: string;
  reason: string;
  recommendedContact: string | null;
}

export interface RelationshipIntelligence {
  stakeholders: Stakeholder[];
  gaps: RelationshipGap[];
  overallRelationshipScore: number;
}

@Injectable()
export class RelationshipIntelligenceEngine {
  private readonly logger = new Logger(RelationshipIntelligenceEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly tenantContext: TenantContextService
  ) {}

  async getRelationshipIntelligence(entityType: 'account' | 'opportunity', entityId: string): Promise<RelationshipIntelligence | null> {
    this.logger.log(`Analyzing relationships for ${entityType}: ${entityId}`);

    const organizationId = this.tenantContext.resolveTenantId();

    let data: any;
    if (entityType === 'account') {
      data = await this.prisma.crmOrganization.findFirst({
        where: { id: entityId, organizationId },
        include: { contacts: { include: { activities: true } }, opportunities: true },
      });
    } else {
      data = await this.prisma.crmOpportunity.findFirst({
        where: { id: entityId, organizationId },
        include: { contacts: { include: { activities: true } }, activities: true },
      });
    }

    if (!data) return null;

    const aiInstruction = `
      Analyze relationships for this ${entityType}.
      Identify decision makers, champions, and blockers.
      Detect missing stakeholders and relationship gaps.
      Return JSON: { "stakeholders": [ { "id": "string", "name": "string", "role": "decision_maker|influencer|champion|blocker|unknown", "relationshipStrength": "weak|neutral|strong" } ], "gaps": [ { "missingRole": "string", "reason": "string", "recommendedContact": "string|null" } ], "overallRelationshipScore": number }
    `;

    try {
      const response = await this.modelProvider.analyze(data, aiInstruction);
      const result: RelationshipIntelligence = JSON.parse(response.content.replace(/```json/g, '').replace(/```/g, ''));
      return result;
    } catch (error) {
      this.logger.error(`Failed to analyze relationships for ${entityType} ${entityId} via AI:`, error);
      return null;
    }
  }
}
