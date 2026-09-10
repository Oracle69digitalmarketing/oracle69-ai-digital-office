import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";
import { CustomerSuccessEventType, CustomerSuccessEvent } from "../events/cs.events.js";

export interface ChurnRisk {
  riskType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  evidence: string[];
}

@Injectable()
export class CsRiskEngine {
  private readonly logger = new Logger(CsRiskEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly messageBus: MessageBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async detectRisks(crmOrganizationId: string): Promise<ChurnRisk[]> {
    this.logger.log(`Detecting risks for organization: ${crmOrganizationId}`);

    const tenantId = this.tenantContext.resolveTenantId();

    const organization = await this.prisma.crmOrganization.findUnique({
      where: { id: crmOrganizationId },
      include: {
        contacts: true,
        opportunities: { orderBy: { updatedAt: "desc" }, take: 100 },
        interactions: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });

    if (!organization || organization.organizationId !== tenantId) {
      throw new NotFoundException("Organization not found");
    }

    const interactions = organization.interactions;
    const interactionCount = interactions.length;
    const opportunities = organization.opportunities;
    const wonOpportunities = opportunities.filter((o) => o.stage === "won");
    const lostOpportunities = opportunities.filter((o) => o.stage === "lost");
    const openOpportunities = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");

    // Recent engagement window (30 days) for deterioration detection
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentInteractions = interactions.filter((i) => i.createdAt >= thirtyDaysAgo);

    const risks: ChurnRisk[] = [];

    // Signal 1: Low engagement
    if (interactionCount === 0) {
      risks.push({
        riskType: "low_engagement",
        severity: "high",
        confidence: 0.85,
        evidence: ["No recorded interactions for this organization"],
      });
    } else if (interactionCount < 3) {
      risks.push({
        riskType: "low_engagement",
        severity: "medium",
        confidence: 0.7,
        evidence: [`Only ${interactionCount} recorded interaction(s)`],
      });
    }

    // Signal 2: Declining engagement
    if (interactionCount >= 3 && recentInteractions.length === 0) {
      risks.push({
        riskType: "declining_engagement",
        severity: "high",
        confidence: 0.75,
        evidence: ["No interactions recorded in the last 30 days"],
      });
    } else if (interactionCount >= 5 && recentInteractions.length / interactionCount < 0.25) {
      risks.push({
        riskType: "declining_engagement",
        severity: "medium",
        confidence: 0.65,
        evidence: ["Most interactions predate the last 30 days"],
      });
    }

    // Signal 3: Stalled / negative pipeline
    if (wonOpportunities.length === 0 && openOpportunities.length === 0) {
      risks.push({
        riskType: "no_active_pipeline",
        severity: lostOpportunities.length > 0 ? "high" : "medium",
        confidence: 0.8,
        evidence: [
          lostOpportunities.length > 0
            ? `${lostOpportunities.length} lost opportunity/ies and no open deals`
            : "No won or open opportunities recorded",
        ],
      });
    }

    // Signal 4: High loss concentration
    if (opportunities.length >= 2 && lostOpportunities.length / opportunities.length >= 0.5) {
      risks.push({
        riskType: "high_loss_concentration",
        severity: "medium",
        confidence: 0.6,
        evidence: [`${lostOpportunities.length} of ${opportunities.length} opportunities lost`],
      });
    }

    // Persist detected risks
    if (risks.length > 0) {
      await this.prisma.csChurnRisk.createMany({
        data: risks.map((risk) => ({
          crmOrganizationId,
          riskType: risk.riskType,
          severity: risk.severity,
        })),
      });
    }

    // Publish detected risks
    for (const risk of risks) {
      this.messageBus.publish(
        CustomerSuccessEventType.CHURN_RISK_DETECTED,
        new CustomerSuccessEvent(CustomerSuccessEventType.CHURN_RISK_DETECTED, {
          crmOrganizationId,
          risk,
        }),
      );
    }

    return risks;
  }
}
