import { jest } from "@jest/globals";
import { CsHealthEngine } from "../services/cs-health.engine.js";
import { CustomerSuccessEventType } from "../events/cs.events.js";

describe("CsHealthEngine", () => {
  let engine: CsHealthEngine;
  let messageBus: any;
  let prisma: any;

  beforeEach(() => {
    messageBus = {
      publish: jest.fn(),
    };
    engine = new CsHealthEngine(messageBus);
    prisma = (engine as any).prisma;
    prisma.csHealthScore.findFirst = jest.fn().mockResolvedValue(null);
    prisma.csHealthScore.create = jest.fn().mockResolvedValue({});
    prisma.crmOrganization.update = jest.fn().mockResolvedValue({});
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

  it("should score a healthy organization and publish an event", async () => {
    mockOrganization({
      contacts: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
      opportunities: [
        { stage: "won" },
        { stage: "won" },
        { stage: "negotiation" },
        { stage: "discovery" },
      ],
      interactions: [
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
      ],
    });

    const result = await engine.calculateHealth("org-123");

    expect(result.status).toBe("healthy");
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.reasoning).toContain("healthy");
    expect(result.factors.length).toBeGreaterThan(0);

    expect(prisma.csHealthScore.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ crmOrganizationId: "org-123", score: result.score }),
    });
    expect(prisma.crmOrganization.update).toHaveBeenCalledWith({
      where: { id: "org-123" },
      data: expect.objectContaining({
        healthScore: result.score,
        lastHealthUpdate: expect.any(Date),
      }),
    });
    expect(messageBus.publish).toHaveBeenCalledWith(
      CustomerSuccessEventType.HEALTH_UPDATED,
      expect.objectContaining({ type: CustomerSuccessEventType.HEALTH_UPDATED }),
    );
  });

  it("should mark an unengaged organization with lost deals as critical", async () => {
    mockOrganization({
      contacts: [],
      opportunities: [{ stage: "lost" }, { stage: "lost" }],
      interactions: [],
    });

    const result = await engine.calculateHealth("org-123");

    expect(result.status).toBe("critical");
    expect(result.score).toBeLessThan(45);
    expect(messageBus.publish).toHaveBeenCalledWith(
      CustomerSuccessEventType.HEALTH_DETERIORATED,
      expect.objectContaining({ type: CustomerSuccessEventType.HEALTH_DETERIORATED }),
    );
  });

  it("should flag deterioration when the new score is lower than the previous score", async () => {
    mockOrganization({
      contacts: [{ id: "c1" }],
      opportunities: [{ stage: "won" }],
      interactions: [
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
      ],
    });
    prisma.csHealthScore.findFirst = jest.fn().mockResolvedValue({ id: "score-1", score: 90 });

    const result = await engine.calculateHealth("org-123");

    expect(result.score).toBeLessThan(90);
    expect(messageBus.publish).toHaveBeenCalledWith(
      CustomerSuccessEventType.HEALTH_DETERIORATED,
      expect.objectContaining({
        type: CustomerSuccessEventType.HEALTH_DETERIORATED,
        payload: expect.objectContaining({ previousScore: 90 }),
      }),
    );
  });

  it("should throw when the organization does not exist", async () => {
    prisma.crmOrganization.findUnique = jest.fn().mockResolvedValue(null);

    await expect(engine.calculateHealth("missing-org")).rejects.toThrow("Organization not found");
    expect(prisma.csHealthScore.create).not.toHaveBeenCalled();
  });
});
