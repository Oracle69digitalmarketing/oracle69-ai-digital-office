import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { PurchaseOrder } from '../types.js';

export const PURCHASE_ORDER_REPOSITORY = 'PURCHASE_ORDER_REPOSITORY';

export interface PurchaseOrderRepository {
  create(po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder>;
  findById(id: string, organizationId: string): Promise<PurchaseOrder | null>;
  findByOrganization(organizationId: string): Promise<PurchaseOrder[]>;
  update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder>;
}

@Injectable()
export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(@Optional() @Inject('PrismaService') private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) throw new Error('PrismaService is not available');
    return this.prisma;
  }

  async create(po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    return this.db.procurementPurchaseOrder.create({ data: po });
  }

  async findById(id: string, organizationId: string): Promise<PurchaseOrder | null> {
    return this.db.procurementPurchaseOrder.findUnique({ where: { id, organizationId } });
  }

  async findByOrganization(organizationId: string): Promise<PurchaseOrder[]> {
    return this.db.procurementPurchaseOrder.findMany({ where: { organizationId } });
  }

  async update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    return this.db.procurementPurchaseOrder.update({ where: { id }, data: data as any });
  }
}
