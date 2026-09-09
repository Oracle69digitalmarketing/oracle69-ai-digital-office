import { jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { MissionStatus, TenantContextService } from "@oracle69/runtime";
import { CsSuccessPlanService } from "../services/cs-success-plan.service.js";
import { CustomerSuccessEventType } from "../events/cs.events.js";

describe("CsSuccessPlanService", () => {
  let service: CsSuccessPlanService;
  let missionManager: any;
  let messageBus: any;
  let prisma: any;
  let tenantContext: any;

  beforeEach(() => {
    missionManager = {
      createMission: jest.fn().mockResolvedValue(undefined),
    };
    messageBus = {
      publish: jest.fn(),
    };
    tenantContext = {
      getTenantId: jest.fn().mockReturnValue("tenant-org"),
      resolveTenantId: jest.fn().mockReturnValue("tenant-org"),
    };
    service = new CsSuccessPlanService(
      missionManager,
      messageBus,
      tenantContext as TenantContextService,
    );
    prisma = (service as any).prisma;
    prisma.crmOrganization.findUnique = jest
      .fn()
      .mockResolvedValue({ id: "org-123", organizationId: "tenant-org" });
    prisma.csSuccessPlan.create = jest.fn().mockImplementation(({ data, include }) =>
      Promise.resolve({
        id: "plan-1",
        ...data,
        milestones: data.milestones?.create ?? [],
      }),
    );
    prisma.csSuccessPlan.findMany = jest.fn().mockResolvedValue([]);
    prisma.csSuccessPlanMilestone.findUnique = jest.fn().mockResolvedValue({
      id: "milestone-1",
      status: "pending",
      successPlan: {
        crmOrganizationId: "org-123",
        crmOrganization: { organizationId: "tenant-org" },
      },
    });
    prisma.csSuccessPlanMilestone.update = jest.fn().mockResolvedValue({
      id: "milestone-1",
      status: "completed",
      successPlanId: "plan-1",
      successPlan: { crmOrganizationId: "org-123" },
    });
    prisma.csInteraction.create = jest.fn().mockResolvedValue({});
  });

  it("should create a success plan with milestones and publish an event", async () => {
    const plan = await service.createSuccessPlan("org-123", "Onboarding Plan", [
      { name: "Activation", dueDate: "2026-09-01T00:00:00.000Z" },
      { name: "Expansion", dueDate: "2026-10-01T00:00:00.000Z" },
    ]);

    expect(prisma.csSuccessPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        crmOrganizationId: "org-123",
        name: "Onboarding Plan",
        milestones: {
          create: [
            { name: "Activation", dueDate: new Date("2026-09-01T00:00:00.000Z") },
            { name: "Expansion", dueDate: new Date("2026-10-01T00:00:00.000Z") },
          ],
        },
      }),
      include: { milestones: true },
    });
    expect(plan.id).toBe("plan-1");
    expect(messageBus.publish).toHaveBeenCalledWith(
      CustomerSuccessEventType.SUCCESS_PLAN_CREATED,
      expect.objectContaining({
        type: CustomerSuccessEventType.SUCCESS_PLAN_CREATED,
        payload: expect.objectContaining({ crmOrganizationId: "org-123", plan }),
      }),
    );
  });

  it("should throw when creating a plan for a missing organization", async () => {
    prisma.crmOrganization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.createSuccessPlan("missing-org", "Plan")).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.csSuccessPlan.create).not.toHaveBeenCalled();
  });

  it("should reject creating a plan for a CRM organization owned by another tenant", async () => {
    prisma.crmOrganization.findUnique = jest
      .fn()
      .mockResolvedValue({ id: "org-b", organizationId: "tenant-org-b" });

    await expect(service.createSuccessPlan("org-b", "Plan")).rejects.toThrow(NotFoundException);
    expect(prisma.csSuccessPlan.create).not.toHaveBeenCalled();
  });

  it("should list success plans for an organization", async () => {
    prisma.csSuccessPlan.findMany = jest.fn().mockResolvedValue([{ id: "plan-1", milestones: [] }]);

    const plans = await service.listSuccessPlans("org-123");

    expect(plans).toHaveLength(1);
    expect(prisma.csSuccessPlan.findMany).toHaveBeenCalledWith({
      where: { crmOrganizationId: "org-123" },
      include: { milestones: { orderBy: { dueDate: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should complete a milestone and publish an event", async () => {
    const milestone = await service.completeMilestone("milestone-1");

    expect(prisma.csSuccessPlanMilestone.findUnique).toHaveBeenCalledWith({
      where: { id: "milestone-1" },
      include: { successPlan: { include: { crmOrganization: true } } },
    });
    expect(prisma.csSuccessPlanMilestone.update).toHaveBeenCalledWith({
      where: { id: "milestone-1" },
      data: { status: "completed" },
      include: { successPlan: true },
    });
    expect(milestone.status).toBe("completed");
    expect(messageBus.publish).toHaveBeenCalledWith(
      CustomerSuccessEventType.SUCCESS_PLAN_MILESTONE_COMPLETED,
      expect.objectContaining({
        type: CustomerSuccessEventType.SUCCESS_PLAN_MILESTONE_COMPLETED,
        payload: expect.objectContaining({
          milestoneId: "milestone-1",
          crmOrganizationId: "org-123",
        }),
      }),
    );
  });

  it("should reject completing a milestone owned by another tenant (404, IDOR)", async () => {
    prisma.csSuccessPlanMilestone.findUnique = jest.fn().mockResolvedValue({
      id: "milestone-foreign",
      status: "pending",
      successPlan: {
        crmOrganizationId: "org-b",
        crmOrganization: { organizationId: "tenant-org-b" },
      },
    });

    await expect(service.completeMilestone("milestone-foreign")).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.csSuccessPlanMilestone.update).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it("should reject completing a milestone that does not exist", async () => {
    prisma.csSuccessPlanMilestone.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.completeMilestone("missing-milestone")).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.csSuccessPlanMilestone.update).not.toHaveBeenCalled();
  });

  it("should trigger an intervention through MissionManager and persist it", async () => {
    const result = await service.triggerIntervention(
      "org-123",
      "Customer executive check-in",
      "high",
    );

    expect(missionManager.createMission).toHaveBeenCalledWith(
      expect.objectContaining({
        goal: "Intervention: Customer executive check-in for organization org-123",
        priority: "high",
        owner: "customer-success",
        status: MissionStatus.DRAFT,
        tenantId: "tenant-org",
      }),
    );
    expect(prisma.csInteraction.create).toHaveBeenCalledWith({
      data: {
        crmOrganizationId: "org-123",
        type: "intervention",
        content: "Customer executive check-in",
      },
    });
    expect(result.missionId).toBeDefined();
    expect(messageBus.publish).toHaveBeenCalledWith(
      CustomerSuccessEventType.INTERVENTION_REQUIRED,
      expect.objectContaining({
        type: CustomerSuccessEventType.INTERVENTION_REQUIRED,
        payload: expect.objectContaining({
          crmOrganizationId: "org-123",
          action: "Customer executive check-in",
          priority: "high",
          missionId: result.missionId,
        }),
      }),
    );
  });

  it("should throw when triggering an intervention for a missing organization", async () => {
    prisma.crmOrganization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.triggerIntervention("missing-org", "Call")).rejects.toThrow(
      NotFoundException,
    );
    expect(missionManager.createMission).not.toHaveBeenCalled();
  });

  it("should reject triggering an intervention for another tenant's CRM organization", async () => {
    prisma.crmOrganization.findUnique = jest
      .fn()
      .mockResolvedValue({ id: "org-b", organizationId: "tenant-org-b" });

    await expect(service.triggerIntervention("org-b", "Call")).rejects.toThrow(
      NotFoundException,
    );
    expect(missionManager.createMission).not.toHaveBeenCalled();
    expect(prisma.csInteraction.create).not.toHaveBeenCalled();
  });
});
