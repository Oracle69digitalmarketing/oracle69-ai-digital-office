import { jest } from "@jest/globals";
import { CsRiskEngine } from "../services/cs-risk.engine.js";
import { CustomerSuccessEventType } from "../events/cs.events.js";

describe("CsRiskEngine", () => {
  let engine: CsRiskEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = {
      publish: jest.fn(),
    };
    engine = new CsRiskEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.csChurnRisk.createMany = jest.fn().mockResolvedValue({ count: 0 });
  });

  function mockOrganization(overrides: any = {}) {
    prisma.crmOrganization.findUnique = jest.fn().mockResolvedValue({
      id: "org-123",
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
});
