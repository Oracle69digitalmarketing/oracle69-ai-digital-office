import { jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { CsRiskEngine } from "../services/cs-risk.engine.js";
import { CustomerSuccessEventType } from "../events/cs.events.js";
import { TenantContextService } from "@oracle69/runtime";

describe("CsRiskEngine", () => {
  let engine: CsRiskEngine;
  let messageBus: any;
  let prisma: any;
  let tenantContext: any;

  beforeEach(() => {
    messageBus = {
      publish: jest.fn(),
    };
    tenantContext = {
      getTenantId: jest.fn().mockReturnValue("tenant-org"),
    };
    engine = new CsRiskEngine(messageBus, tenantContext as TenantContextService);
    prisma = (engine as any).prisma;
    prisma.csChurnRisk.createMany = jest.fn().mockResolvedValue({ count: 0 });
  });

  function mockOrganization(overrides: any = {}) {
    prisma.crmOrganization.findUnique = jest.fn().mockResolvedValue({
      id: "org-123",
      organizationId: "tenant-org",
      contacts: [],
      opportunities: [],
      interactions: [],
      ...overrides,
    });
  }

  it("should detect low engagement with no interactions and persist the risk", async () => {
    mockOrganization();

    const risks = await engine.detectRisks("org-123");

    expect(risks).toContainEqual(
      expect.objectContaining({ riskType: "low_engagement", severity: "high" }),
    );
    expect(prisma.csChurnRisk.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ crmOrganizationId: "org-123", riskType: "low_engagement" }),
      ]),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      CustomerSuccessEventType.CHURN_RISK_DETECTED,
      expect.objectContaining({
        type: CustomerSuccessEventType.CHURN_RISK_DETECTED,
        payload: expect.objectContaining({ crmOrganizationId: "org-123" }),
      }),
    );
  });

  it("should flag declining engagement and a stalled pipeline for an inactive account", async () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    mockOrganization({
      opportunities: [{ stage: "lost" }, { stage: "lost" }],
      interactions: [{ createdAt: oldDate }, { createdAt: oldDate }, { createdAt: oldDate }],
    });

    const risks = await engine.detectRisks("org-123");

    expect(risks.map((r: any) => r.riskType)).toEqual(
      expect.arrayContaining([
        "declining_engagement",
        "no_active_pipeline",
        "high_loss_concentration",
      ]),
    );
  });

  it("should return no risks for a healthy organization", async () => {
    mockOrganization({
      contacts: [{ id: "c1" }],
      opportunities: [{ stage: "won" }, { stage: "discovery" }],
      interactions: [
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
      ],
    });

    const risks = await engine.detectRisks("org-123");

    expect(risks).toEqual([]);
    expect(prisma.csChurnRisk.createMany).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it("should throw when the organization does not exist", async () => {
    prisma.crmOrganization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.detectRisks("missing-org")).rejects.toThrow("Organization not found");
    expect(prisma.csChurnRisk.createMany).not.toHaveBeenCalled();
  });

  it("should reject a CRM organization owned by another tenant (404)", async () => {
    prisma.crmOrganization.findUnique = jest.fn().mockResolvedValue({
      id: "org-foreign",
      organizationId: "tenant-org-b",
      contacts: [],
      opportunities: [],
      interactions: [],
    });

    await expect(engine.detectRisks("org-foreign")).rejects.toThrow(NotFoundException);
    expect(prisma.csChurnRisk.createMany).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it("should fail closed when no tenant context is active", async () => {
    tenantContext.getTenantId.mockReturnValue(undefined);
    mockOrganization();

    await expect(engine.detectRisks("org-123")).rejects.toThrow(NotFoundException);
    expect(prisma.csChurnRisk.createMany).not.toHaveBeenCalled();
  });
});
