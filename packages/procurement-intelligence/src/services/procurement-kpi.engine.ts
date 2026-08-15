import { Inject, Injectable } from '@nestjs/common';
import { SUPPLIER_REPOSITORY, type SupplierRepository } from '../repositories/supplier.repository.js';
import { PURCHASE_ORDER_REPOSITORY, type PurchaseOrderRepository } from '../repositories/purchase-order.repository.js';

export interface ProcurementKpiMetrics {
  totalSpend: number;
  poCount: number;
  poStatusBreakdown: Record<string, number>;
  spendBySupplier: Record<string, number>;
}

@Injectable()
export class ProcurementKpiEngine {
  constructor(
    @Inject(SUPPLIER_REPOSITORY) private readonly supplierRepo: SupplierRepository,
    @Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: PurchaseOrderRepository,
  ) {}

  async computeMetrics(organizationId: string): Promise<ProcurementKpiMetrics> {
    const pos = await this.poRepo.findByOrganization(organizationId);
    const suppliers = await this.supplierRepo.findByOrganization(organizationId);

    const totalSpend = pos.reduce((sum, po) => sum + po.amount, 0);
    const poCount = pos.length;
    
    const poStatusBreakdown = pos.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const spendBySupplier = pos.reduce((acc, po) => {
      const supplier = suppliers.find(s => s.id === po.supplierId);
      const supplierName = supplier ? supplier.name : 'Unknown';
      acc[supplierName] = (acc[supplierName] || 0) + po.amount;
      return acc;
    }, {} as Record<string, number>);

    return { totalSpend, poCount, poStatusBreakdown, spendBySupplier };
  }
}
