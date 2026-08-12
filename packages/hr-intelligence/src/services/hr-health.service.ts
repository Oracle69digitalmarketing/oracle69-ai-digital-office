import { Injectable } from '@nestjs/common';
import { HrKpiService } from './hr-kpi.service.js';
import { HrHealth } from '../types.js';

const HEALTH_FACTORS: Record<'healthy' | 'at_risk' | 'critical', number> = {
  healthy: 80,
  at_risk: 55,
  critical: 30,
};

/**
 * Assembles a tenant-scoped workforce health snapshot from the persisted HR
 * KPIs. The deterministic score is derived from headcount, turnover, open
 * position coverage and pipeline sufficiency, and is consumed by the AI insight
 * service for workforce analysis and forecasting.
 */
@Injectable()
export class HrHealthService {
  constructor(private readonly kpiService: HrKpiService) {}

  async assess(organizationId?: string): Promise<HrHealth> {
    const kpis = await this.kpiService.getKpis(organizationId);

    const reasoning: string[] = [];
    let score = HEALTH_FACTORS.healthy;

    if (kpis.headcount === 0) {
      score = HEALTH_FACTORS.critical - 10;
      reasoning.push('The organization has no active employees; the workforce is empty.');
    } else {
      reasoning.push(
        `The organization has ${kpis.headcount} employee(s) (${kpis.onboardingCount} onboarding, ${kpis.activeHeadcount} active).`,
      );
    }

    if (kpis.turnoverRate > 0.25) {
      score -= 20;
      reasoning.push(`Turnover is high: ${(kpis.turnoverRate * 100).toFixed(0)}% of the workforce has left.`);
    } else if (kpis.turnoverRate > 0.1) {
      score -= 10;
      reasoning.push(`Turnover is elevated at ${(kpis.turnoverRate * 100).toFixed(0)}%.`);
    }

    if (kpis.openPositions > 0) {
      score -= 10;
      reasoning.push(`${kpis.openPositions} position(s) remain open and unfilled.`);
    }

    if (kpis.openPositions > 0 && kpis.candidatesInPipeline < kpis.openPositions) {
      score -= 15;
      reasoning.push('The candidate pipeline cannot cover the open positions; hiring is at risk.');
    }

    if (kpis.averageTimeToHireDays > 45) {
      score -= 10;
      reasoning.push(`Average time to hire is ${kpis.averageTimeToHireDays} day(s), above the 45-day target.`);
    }

    if (kpis.offerAcceptanceRate >= 0.5 && kpis.turnoverRate <= 0.1) {
      score += 5;
      reasoning.push('Offer acceptance is strong and turnover is controlled; the workforce is stable.');
    }

    const status: HrHealth['status'] = score >= HEALTH_FACTORS.healthy ? 'healthy' : score >= HEALTH_FACTORS.at_risk ? 'at_risk' : 'critical';

    return {
      score: Math.max(0, Math.min(100, score)),
      status,
      kpis,
      openPositions: kpis.openPositions,
      candidatesInPipeline: kpis.candidatesInPipeline,
      reasoning,
    };
  }
}
