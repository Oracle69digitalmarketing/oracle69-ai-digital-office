import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LeadScoringEngine } from '../lead-scoring/lead-scoring.engine.js';
import { OpportunityEngine } from '../opportunity-scoring/opportunity.engine.js';
import { DealRiskEngine } from '../deal-risk/deal-risk.engine.js';
import { ForecastingEngine } from '../forecasting/forecasting.engine.js';
import { NextBestActionEngine } from '../next-best-action/nba.engine.js';
import { AccountIntelligenceEngine } from '../account-intelligence/account.engine.js';
import { PipelineIntelligenceEngine } from '../pipeline-intelligence/pipeline.engine.js';
import { RelationshipIntelligenceEngine } from '../relationship-intelligence/relationship.engine.js';
import { CustomerSignalEngine } from '../customer-signals/signal.engine.js';
import { ExecutiveIntelligenceEngine } from '../executive-intelligence/executive.engine.js';
import { MemoryManager, MissionManager, MissionStatus } from '@oracle69/runtime';

@Injectable()
export class SalesIntelligenceService {
  private readonly logger = new Logger(SalesIntelligenceService.name);

  constructor(
    private readonly leadScoring: LeadScoringEngine,
    private readonly opportunityEngine: OpportunityEngine,
    private readonly dealRisk: DealRiskEngine,
    private readonly forecasting: ForecastingEngine,
    private readonly nbaEngine: NextBestActionEngine,
    private readonly accountEngine: AccountIntelligenceEngine,
    private readonly pipelineEngine: PipelineIntelligenceEngine,
    private readonly relationshipEngine: RelationshipIntelligenceEngine,
    private readonly customerSignals: CustomerSignalEngine,
    private readonly executiveEngine: ExecutiveIntelligenceEngine,
    private readonly memory: MemoryManager,
    private readonly missionManager: MissionManager
  ) {}

  async requestMission(goal: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal') {
    const missionId = uuidv4();
    await this.missionManager.createMission({
      id: missionId,
      goal,
      priority,
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(), // 1 week
      owner: 'sales-intelligence',
      status: MissionStatus.DRAFT
    });
    return { missionId };
  }

  async analyzeLead(leadId: string) {
    const result = await this.leadScoring.scoreLead(leadId);
    if (result) {
      await this.memory.save({
        id: uuidv4(),
        type: 'business',
        content: `Lead ${leadId} scored ${result.score} (Grade ${result.grade}). Reason: ${result.reasoning.join(', ')}`,
        timestamp: new Date().toISOString(),
        metadata: { leadId, ...result }
      });
    }
    return result;
  }

  async analyzeOpportunity(opportunityId: string) {
    const analysis = await this.opportunityEngine.analyzeOpportunity(opportunityId);
    const risks = await this.dealRisk.detectRisks(opportunityId);
    const nba = await this.nbaEngine.recommendNextAction('opportunity', opportunityId);
    
    const result = { analysis, risks, nba };

    await this.memory.save({
      id: uuidv4(),
      type: 'business',
      content: `Opportunity ${opportunityId} analyzed. Win Probability: ${analysis?.winProbability}. NBA: ${nba?.action}`,
      timestamp: new Date().toISOString(),
      metadata: { opportunityId, ...result }
    });

    return result;
  }

  async getAccount360(accountId: string) {
    return this.accountEngine.getAccount360(accountId);
  }

  async getPipelineIntelligence(organizationId: string) {
    return this.pipelineEngine.getPipelineIntelligence(organizationId);
  }

  async getForecast(organizationId: string) {
    return this.forecasting.generateForecast(organizationId);
  }

  async getExecutiveIntelligence(organizationId: string) {
    return this.executiveEngine.generateExecutiveSummary(organizationId);
  }
}
