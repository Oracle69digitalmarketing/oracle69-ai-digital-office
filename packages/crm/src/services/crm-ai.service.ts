import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';

@Injectable()
export class CrmAiService {
  private readonly logger = new Logger(CrmAiService.name);
  private prisma = new PrismaClient();
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async scoreLead(leadId: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    const lead = await this.prisma.crmLead.findUnique({
      where: { id: leadId, organizationId: tenantId },
      include: {
        crmOrganization: true,
        notes: true,
        activities: true,
      },
    });

    if (!lead) return null;

    const prompt = `
      Score this sales lead from 0 to 100 based on the following data:
      Lead Title: ${lead.title}
      Source: ${lead.source}
      Organization: ${lead.crmOrganization?.name}
      Industry: ${lead.crmOrganization?.industry}
      Notes: ${lead.notes.map(n => n.content).join('; ')}
      Activities: ${lead.activities.map(a => a.subject).join('; ')}
      
      Respond only with a JSON object: { "score": number, "rationale": "string" }
    `;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json/g, '').replace(/```/g, '');
      const data = JSON.parse(text);

      await this.prisma.crmLead.update({
        where: { id: leadId, organizationId: tenantId },
        data: { score: data.score },
      });

      this.messageBus.publish(
        CrmEventType.LEAD_SCORED,
        new CrmEvent(CrmEventType.LEAD_SCORED, { leadId, score: data.score, rationale: data.rationale }),
        { tenantId }
      );

      return data;
    } catch (error) {
      this.logger.error(`Failed to score lead ${leadId}:`, error);
      return null;
    }
  }

  async predictOpportunityProbability(opportunityId: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    const opportunity = await this.prisma.crmOpportunity.findUnique({
      where: { id: opportunityId, organizationId: tenantId },
      include: {
        crmOrganization: true,
        pipeline: { include: { stages: true } },
        activities: true,
      },
    });

    if (!opportunity) return null;

    const prompt = `
      Predict the probability (0.0 to 1.0) of winning this sales opportunity:
      Name: ${opportunity.name}
      Value: ${opportunity.value}
      Current Stage: ${opportunity.stage}
      Organization: ${opportunity.crmOrganization?.name}
      Activities: ${opportunity.activities.map(a => a.subject).join('; ')}
      
      Respond only with a JSON object: { "probability": number, "rationale": "string" }
    `;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json/g, '').replace(/```/g, '');
      const data = JSON.parse(text);

      await this.prisma.crmOpportunity.update({
        where: { id: opportunityId, organizationId: tenantId },
        data: { probability: data.probability },
      });

      this.messageBus.publish(
        CrmEventType.OPPORTUNITY_PREDICTED,
        new CrmEvent(CrmEventType.OPPORTUNITY_PREDICTED, { opportunityId, probability: data.probability, rationale: data.rationale }),
        { tenantId }
      );

      return data;
    } catch (error) {
      this.logger.error(`Failed to predict opportunity ${opportunityId}:`, error);
      return null;
    }
  }

  async summarizeActivity(activityId: string) {
    const tenantId = this.tenantContext.resolveTenantId();
    const activity = await this.prisma.crmActivity.findUnique({
      where: { id: activityId, organizationId: tenantId },
      include: { notes: true },
    });

    if (!activity) return null;

    const prompt = `
      Summarize this sales activity and suggest next steps:
      Subject: ${activity.subject}
      Description: ${activity.description}
      Notes: ${activity.notes.map(n => n.content).join('; ')}
      
      Respond only with a JSON object: { "summary": "string", "nextSteps": ["string"] }
    `;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json/g, '').replace(/```/g, '');
      const data = JSON.parse(text);

      this.messageBus.publish(
        CrmEventType.ACTIVITY_SUMMARIZED,
        new CrmEvent(CrmEventType.ACTIVITY_SUMMARIZED, { activityId, ...data }),
        { tenantId }
      );

      return data;
    } catch (error) {
      this.logger.error(`Failed to summarize activity ${activityId}:`, error);
      return null;
    }
  }
}
