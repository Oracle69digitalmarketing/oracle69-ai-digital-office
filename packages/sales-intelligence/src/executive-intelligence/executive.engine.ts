import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, TenantContextService } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { AiModelProvider } from '../models/ai-model.interface.js';
import { SalesIntelligenceEventType, SalesIntelligenceEvent } from '../events/sales-intelligence.events.js';

export interface ExecutiveAlert {
  title: string;
  severity: 'info' | 'warning' | 'critical';
  impact: string;
  strategicObservation: string;
  recommendedExecutiveAction: string;
}

@Injectable()
export class ExecutiveIntelligenceEngine {
  private readonly logger = new Logger(ExecutiveIntelligenceEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: any,
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService
  ) {}

  async generateExecutiveSummary(organizationId: string): Promise<ExecutiveAlert[] | null> {
    this.logger.log(`Generating executive intelligence for organization: ${organizationId}`);

    const data = await this.prisma.organization.findUnique({
      where: {
        id: this.tenantContext.resolveTenantId(organizationId)
      },
      include: {
        crmOpportunities: { include: { activities: true } },
        crmPipelines: true,
      },
    });

    if (!data) return null;

    const aiInstruction = `
      Analyze the sales performance and pipeline for this organization from an executive perspective.
      Focus on strategic risks, high-value deals, and forecast health.
      Return JSON: { "alerts": [ { "title": "string", "severity": "info|warning|critical", "impact": "string", "strategicObservation": "string", "recommendedExecutiveAction": "string" } ] }
    `;

    try {
      const response = await this.modelProvider.analyze(data, aiInstruction);
      const result = JSON.parse(response.content.replace(/```json/g, '').replace(/```/g, ''));
      const alerts: ExecutiveAlert[] = result.alerts || [];

      if (alerts.some(a => a.severity === 'critical')) {
        this.messageBus.publish(
          SalesIntelligenceEventType.EXECUTIVE_SALES_ALERT_CREATED,
          new SalesIntelligenceEvent(SalesIntelligenceEventType.EXECUTIVE_SALES_ALERT_CREATED, {
            organizationId,
            alerts,
            tenantId: this.tenantContext.resolveTenantId()
          })
        );
      }

      return alerts;
    } catch (error) {
      this.logger.error(`Failed to generate executive intelligence for organization ${organizationId} via AI:`, error);
      return null;
    }
  }
}
