import { Injectable, Logger } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { AiModelProvider } from '../models/ai-model.interface.js';
import { SalesIntelligenceEventType, SalesIntelligenceEvent } from '../events/sales-intelligence.events.js';

export interface LeadScoreResult {
  score: number;
  grade: string;
  status: string;
  recommendedAction: string;
  confidence: number;
  reasoning: string[];
}

@Injectable()
export class LeadScoringEngine {
  private readonly logger = new Logger(LeadScoringEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly messageBus: MessageBus
  ) {}

  async scoreLead(leadId: string): Promise<LeadScoreResult | null> {
    this.logger.log(`Scoring lead: ${leadId}`);

    const lead = await this.prisma.crmLead.findUnique({
      where: { id: leadId },
      include: {
        crmOrganization: true,
        activities: true,
        notes: true,
      },
    });

    if (!lead) {
      this.logger.error(`Lead not found: ${leadId}`);
      return null;
    }

    // Deterministic base score
    let baseScore = 0;
    if (lead.source === 'referral') baseScore += 20;
    if (lead.crmOrganization?.revenue && lead.crmOrganization.revenue > 1000000) baseScore += 15;
    if (lead.activities.length > 5) baseScore += 10;

    // AI-enhanced analysis
    const aiInstruction = `
      Score this sales lead from 0 to 100 and provide a detailed analysis.
      Focus on industry relevance, engagement quality, and conversion likelihood.
      Return JSON: { "score": number, "grade": "A|B|C|D", "status": "qualified|disqualified|nurture", "recommendedAction": "string", "confidence": 0.0-1.0, "reasoning": ["string"] }
    `;

    try {
      const response = await this.modelProvider.analyze(lead, aiInstruction);
      const result: LeadScoreResult = JSON.parse(response.content.replace(/```json/g, '').replace(/```/g, ''));
      
      // Combine scores
      const finalScore = Math.min(100, Math.round((result.score + baseScore) / 1.1));
      result.score = finalScore;

      // Update CRM
      await this.prisma.crmLead.update({
        where: { id: leadId },
        data: { score: finalScore },
      });

      // Publish event
      this.messageBus.publish(
        SalesIntelligenceEventType.LEAD_SCORED,
        new SalesIntelligenceEvent(SalesIntelligenceEventType.LEAD_SCORED, { leadId, ...result })
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to score lead ${leadId} via AI:`, error);
      return null;
    }
  }
}
