import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CsHealthEngine } from '../services/cs-health.engine.js';
import { CsRiskEngine } from '../services/cs-risk.engine.js';
import { CsSuccessPlanService, SuccessPlanMilestoneInput } from '../services/cs-success-plan.service.js';

export interface CreateSuccessPlanBody {
  name: string;
  milestones?: SuccessPlanMilestoneInput[];
}

export interface TriggerInterventionBody {
  action: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

@Controller('customer-success')
export class CustomerSuccessController {
  constructor(
    private readonly healthEngine: CsHealthEngine,
    private readonly riskEngine: CsRiskEngine,
    private readonly successPlanService: CsSuccessPlanService
  ) {}

  @Get('health/:crmOrganizationId')
  async getHealth(@Param('crmOrganizationId') orgId: string) {
    return this.healthEngine.calculateHealth(orgId);
  }

  @Get('risks/:crmOrganizationId')
  async getRisks(@Param('crmOrganizationId') orgId: string) {
    return this.riskEngine.detectRisks(orgId);
  }

  @Get('plans/:crmOrganizationId')
  async listPlans(@Param('crmOrganizationId') orgId: string) {
    return this.successPlanService.listSuccessPlans(orgId);
  }

  @Post('plans/:crmOrganizationId')
  async createPlan(@Param('crmOrganizationId') orgId: string, @Body() body: CreateSuccessPlanBody) {
    return this.successPlanService.createSuccessPlan(orgId, body.name, body.milestones);
  }

  @Post('plans/milestones/:milestoneId/complete')
  async completeMilestone(@Param('milestoneId') milestoneId: string) {
    return this.successPlanService.completeMilestone(milestoneId);
  }

  @Post('interventions/:crmOrganizationId')
  async triggerIntervention(@Param('crmOrganizationId') orgId: string, @Body() body: TriggerInterventionBody) {
    return this.successPlanService.triggerIntervention(orgId, body.action, body.priority);
  }
}
