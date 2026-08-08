import { Injectable, Logger } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { SalesIntelligenceEventType, SalesIntelligenceEvent } from '../events/sales-intelligence.events.js';

export interface SalesSignal {
  type: string;
  entityType: 'lead' | 'opportunity' | 'account' | 'activity';
  entityId: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
}

@Injectable()
export class CustomerSignalEngine {
  private readonly logger = new Logger(CustomerSignalEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly messageBus: MessageBus
  ) {}

  async detectSignalsFromActivity(activityId: string): Promise<SalesSignal | null> {
    const activity = await this.prisma.crmActivity.findUnique({
      where: { id: activityId },
      include: { crmContact: true, crmOpportunity: true, crmLead: true },
    });

    if (!activity) return null;

    let signal: SalesSignal | null = null;

    if (activity.type === 'email' && activity.subject.toLowerCase().includes('complaint')) {
      signal = {
        type: 'customer_complaint',
        entityType: 'activity',
        entityId: activityId,
        severity: 'high',
        description: `Customer complaint detected in activity: ${activity.subject}`,
        timestamp: new Date(),
      };
    } else if (activity.crmOpportunity && activity.crmOpportunity.value > 100000) {
       signal = {
        type: 'high_value_deal_activity',
        entityType: 'opportunity',
        entityId: activity.crmOpportunityId!,
        severity: 'medium',
        description: `Activity on high-value deal: ${activity.crmOpportunity.name}`,
        timestamp: new Date(),
      };
    }

    if (signal) {
      this.messageBus.publish(
        SalesIntelligenceEventType.SALES_SIGNAL_DETECTED,
        new SalesIntelligenceEvent(SalesIntelligenceEventType.SALES_SIGNAL_DETECTED, { signal })
      );
    }

    return signal;
  }
}
