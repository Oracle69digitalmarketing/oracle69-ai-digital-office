import { Inject, Injectable } from "@nestjs/common";
import {
  SUPPLIER_REPOSITORY,
  type SupplierRepository,
} from "../repositories/supplier.repository.js";
import {
  PURCHASE_ORDER_REPOSITORY,
  type PurchaseOrderRepository,
} from "../repositories/purchase-order.repository.js";
import { Supplier, PurchaseOrder } from "../types.js";
import { EventBus, TenantContextService } from "@oracle69/runtime";
import { ProcurementEventType } from "../events/procurement.events.js";

const EVENT_SOURCE = "procurement-intelligence";

@Injectable()
export class ProcurementService {
  constructor(
    @Inject(SUPPLIER_REPOSITORY) private readonly supplierRepo: SupplierRepository,
    @Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: PurchaseOrderRepository,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createSupplier(
    supplier: Omit<Supplier, "id" | "organizationId"> & { organizationId?: string },
  ): Promise<Supplier> {
    const tenantId = this.tenantContext.resolveTenantId(supplier.organizationId);
    const created = await this.supplierRepo.create({ ...supplier, organizationId: tenantId });
    await this.eventBus.publish(ProcurementEventType.SUPPLIER_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async listSuppliers(organizationId?: string): Promise<Supplier[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.supplierRepo.findByOrganization(tenantId);
  }

  async createPurchaseOrder(
    po: Omit<PurchaseOrder, "id" | "organizationId"> & { organizationId?: string },
  ): Promise<PurchaseOrder> {
    const tenantId = this.tenantContext.resolveTenantId(po.organizationId);
    const created = await this.poRepo.create({ ...po, organizationId: tenantId });
    await this.eventBus.publish(ProcurementEventType.PURCHASE_ORDER_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async updatePurchaseOrder(
    id: string,
    data: Partial<PurchaseOrder> & { organizationId?: string },
  ): Promise<PurchaseOrder> {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const existing = await this.poRepo.findById(id, tenantId);
    if (!existing) throw new Error("Purchase order not found");
    const updated = await this.poRepo.update(id, data);
    await this.eventBus.publish(ProcurementEventType.PURCHASE_ORDER_UPDATED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async listPurchaseOrders(organizationId?: string): Promise<PurchaseOrder[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.poRepo.findByOrganization(tenantId);
  }
}
