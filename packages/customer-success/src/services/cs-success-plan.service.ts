import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { MissionManager, MissionStatus, MessageBus, TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { CustomerSuccessEventType, CustomerSuccessEvent } from "../events/cs.events.js";

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
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  private assertCrmOrganizationBelongsToTenant(
    organization: { id: string; organizationId: string } | null,
  ): void {
    if (!organization || organization.organizationId !== this.tenantContext.getTenantId()) {
      throw new NotFoundException(`Crm organization ${organization?.id ?? "unknown"} not found`);
    }
  }

  async createSuccessPlan(
    crmOrganizationId: string,
    name: string,
    milestones: SuccessPlanMilestoneInput[] = [],
  ) {
    const organization = await this.prisma.crmOrganization.findUnique({
      where: { id: crmOrganizationId },
    });
    this.assertCrmOrganizationBelongsToTenant(organization);

    const plan = await this.prisma.csSuccessPlan.create({
      data: {
        crmOrganizationId,
        name,
        milestones:
          milestones.length > 0
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
      new CustomerSuccessEvent(CustomerSuccessEventType.SUCCESS_PLAN_CREATED, {
        crmOrganizationId,
        plan,
      }),
    );

    return plan;
  }

  async listSuccessPlans(crmOrganizationId: string) {
    const organization = await this.prisma.crmOrganization.findUnique({
      where: { id: crmOrganizationId },
    });
    this.assertCrmOrganizationBelongsToTenant(organization);

    return this.prisma.csSuccessPlan.findMany({
      where: { crmOrganizationId },
      include: { milestones: { orderBy: { dueDate: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async completeMilestone(milestoneId: string) {
    const milestone = await this.prisma.csSuccessPlanMilestone.findUnique({
      where: { id: milestoneId },
      include: { successPlan: { include: { crmOrganization: true } } },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${milestoneId} not found`);
    }

    const crmOrganizationOrganizationId = milestone.successPlan.crmOrganization.organizationId;
    if (this.tenantContext.getTenantId() !== crmOrganizationOrganizationId) {
      throw new NotFoundException(`Milestone with ID ${milestoneId} not found`);
    }

    const updated = await this.prisma.csSuccessPlanMilestone.update({
      where: { id: milestoneId },
      data: { status: "completed" },
      include: { successPlan: true },
    });

    this.messageBus.publish(
      CustomerSuccessEventType.SUCCESS_PLAN_MILESTONE_COMPLETED,
      new CustomerSuccessEvent(CustomerSuccessEventType.SUCCESS_PLAN_MILESTONE_COMPLETED, {
        milestoneId,
        successPlanId: updated.successPlanId,
        crmOrganizationId: updated.successPlan.crmOrganizationId,
      }),
    );

    return updated;
  }

  async triggerIntervention(
    crmOrganizationId: string,
    action: string,
    priority: "low" | "normal" | "high" | "critical" = "normal",
  ) {
    this.logger.log(
      `Triggering intervention for organization: ${crmOrganizationId}, action: ${action}`,
    );

    const organization = await this.prisma.crmOrganization.findUnique({
      where: { id: crmOrganizationId },
    });
    this.assertCrmOrganizationBelongsToTenant(organization);

    const tenantId = this.tenantContext.resolveTenantId();

    const missionId = uuidv4();
    await this.missionManager.createMission({
      id: missionId,
      goal: `Intervention: ${action} for organization ${crmOrganizationId}`,
      priority,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
      owner: "customer-success",
      status: MissionStatus.DRAFT,
      tenantId: tenantId,
    });

    // Persist the intervention as an interaction so downstream intelligence can use it
    await this.prisma.csInteraction.create({
      data: {
        crmOrganizationId,
        type: "intervention",
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
      }),
    );

    return { missionId };
  }
}
