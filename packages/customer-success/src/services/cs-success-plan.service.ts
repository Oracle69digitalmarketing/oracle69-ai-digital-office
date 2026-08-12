import { Injectable, Logger } from '@nestjs/common';
import { MissionManager, MissionStatus } from '@oracle69/runtime';
import { MessageBus } from '@oracle69/runtime';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CustomerSuccessEventType, CustomerSuccessEvent } from '../events/cs.events.js';

export interface SuccessPlanMilestoneInput {
  name: string;
  dueDate: string;
}

@Injectable()
export class CsSuccessPlanService {
  private readonly logger = new Logger(CsSuccessPlanService.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly missionManager: MissionManager,
    private readonly messageBus: MessageBus
  ) {}

  async createSuccessPlan(crmOrganizationId: string, name: string, milestones: SuccessPlanMilestoneInput[] = []) {
    const organization = await this.prisma.crmOrganization.findUnique({
      where: { id: crmOrganizationId },
      select: { id: true },
    });
    if (!organization) throw new Error('Organization not found');

    const plan = await this.prisma.csSuccessPlan.create({
      data: {
        crmOrganizationId,
        name,
        milestones: milestones.length > 0
          ? {
              create: milestones.map((milestone) => ({
                name: milestone.name,
                dueDate: new Date(milestone.dueDate),
              })),
            }
          : undefined,
      },
      include: { milestones: true },
    });

    this.messageBus.publish(
      CustomerSuccessEventType.SUCCESS_PLAN_CREATED,
      new CustomerSuccessEvent(CustomerSuccessEventType.SUCCESS_PLAN_CREATED, { crmOrganizationId, plan })
    );

    return plan;
  }

  async listSuccessPlans(crmOrganizationId: string) {
    return this.prisma.csSuccessPlan.findMany({
      where: { crmOrganizationId },
      include: { milestones: { orderBy: { dueDate: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async completeMilestone(milestoneId: string) {
    const milestone = await this.prisma.csSuccessPlanMilestone.update({
      where: { id: milestoneId },
      data: { status: 'completed' },
      include: { successPlan: true },
    });

    this.messageBus.publish(
      CustomerSuccessEventType.SUCCESS_PLAN_MILESTONE_COMPLETED,
      new CustomerSuccessEvent(CustomerSuccessEventType.SUCCESS_PLAN_MILESTONE_COMPLETED, {
        milestoneId,
        successPlanId: milestone.successPlanId,
        crmOrganizationId: milestone.successPlan.crmOrganizationId,
      })
    );

    return milestone;
  }

  async triggerIntervention(crmOrganizationId: string, action: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal') {
    this.logger.log(`Triggering intervention for organization: ${crmOrganizationId}, action: ${action}`);

    const organization = await this.prisma.crmOrganization.findUnique({
      where: { id: crmOrganizationId },
      select: { id: true },
    });
    if (!organization) throw new Error('Organization not found');

    const missionId = uuidv4();
    await this.missionManager.createMission({
      id: missionId,
      goal: `Intervention: ${action} for organization ${crmOrganizationId}`,
      priority,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
      owner: 'customer-success',
      status: MissionStatus.DRAFT,
      tenantId: crmOrganizationId
    });

    // Persist the intervention as an interaction so downstream intelligence can use it
    await this.prisma.csInteraction.create({
      data: {
        crmOrganizationId,
        type: 'intervention',
        content: action,
      },
    });

    this.messageBus.publish(
      CustomerSuccessEventType.INTERVENTION_REQUIRED,
      new CustomerSuccessEvent(CustomerSuccessEventType.INTERVENTION_REQUIRED, {
        crmOrganizationId,
        action,
        priority,
        missionId,
      })
    );

    return { missionId };
  }
}
