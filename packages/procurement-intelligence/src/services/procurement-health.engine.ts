import { Inject, Injectable } from "@nestjs/common";
import { MessageBus } from "@oracle69/runtime";
import {
  PURCHASE_ORDER_REPOSITORY,
  type PurchaseOrderRepository,
} from "../repositories/purchase-order.repository.js";
import { ProcurementEventType } from "../events/procurement.events.js";

export interface ProcurementHealthResult {
  status: "healthy" | "warning" | "critical";
  score: number;
  reasoning: string;
}

@Injectable()
export class ProcurementHealthEngine {
  constructor(
    @Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: PurchaseOrderRepository,
    private readonly messageBus: MessageBus,
  ) {}

  async assessHealth(organizationId: string): Promise<ProcurementHealthResult> {
    const pos = await this.poRepo.findByOrganization(organizationId);

    // Deterministic simple health logic: check for pending orders
    const pendingOrders = pos.filter((po) => po.status === "pending");
    const score =
      pos.length > 0 ? Math.max(0, 100 - (pendingOrders.length / pos.length) * 100) : 100;

    const status: "healthy" | "warning" | "critical" =
      score > 70 ? "healthy" : score > 40 ? "warning" : "critical";
    const reasoning = `Health based on pending PO ratio of ${pendingOrders.length}/${pos.length}`;

    const result: ProcurementHealthResult = { status, score, reasoning };

    await this.messageBus.publish(ProcurementEventType.HEALTH_UPDATED, {
      tenantId: organizationId,
      source: "procurement-intelligence",
      payload: result,
    });

    return result;
  }
}
