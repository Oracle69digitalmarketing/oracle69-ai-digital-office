import { Injectable } from '@nestjs/common';
import { MessageBus } from '@oracle69/runtime';
import { ProcurementKpiEngine } from './procurement-kpi.engine.js';
import { ProcurementHealthEngine } from './procurement-health.engine.js';
import { ProcurementEventType } from '../events/procurement.events.js';

@Injectable()
export class ProcurementInsightService {
  constructor(
    private readonly kpiEngine: ProcurementKpiEngine,
    private readonly healthEngine: ProcurementHealthEngine,
    private readonly messageBus: MessageBus,
  ) {}

  async generateInsights(organizationId: string) {
    const [kpi, health] = await Promise.all([
      this.kpiEngine.computeMetrics(organizationId),
      this.healthEngine.assessHealth(organizationId),
    ]);

    const insight = {
      summary: `Procurement status: ${health.status}. Total spend: ${kpi.totalSpend}.`,
      recommendation: health.status === 'critical' ? 'Review pending purchase orders immediately.' : 'Maintain operations.',
    };

    await this.messageBus.publish(ProcurementEventType.INSIGHT_GENERATED, {
      tenantId: organizationId,
      source: 'procurement-intelligence',
      payload: insight
    });

    return insight;
  }
}
