import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { Supplier } from '../types.js';

export const SUPPLIER_REPOSITORY = 'SUPPLIER_REPOSITORY';

export interface SupplierRepository {
  create(supplier: Omit<Supplier, 'id'>): Promise<Supplier>;
  findById(id: string, organizationId: string): Promise<Supplier | null>;
  findByOrganization(organizationId: string): Promise<Supplier[]>;
}

@Injectable()
export class PrismaSupplierRepository implements SupplierRepository {
  constructor(@Optional() @Inject('PrismaService') private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) throw new Error('PrismaService is not available');
    return this.prisma;
  }

  async create(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    return this.db.procurementSupplier.create({ data: supplier });
  }

  async findById(id: string, organizationId: string): Promise<Supplier | null> {
    return this.db.procurementSupplier.findUnique({ where: { id, organizationId } });
  }

  async findByOrganization(organizationId: string): Promise<Supplier[]> {
    return this.db.procurementSupplier.findMany({ where: { organizationId } });
  }
}
