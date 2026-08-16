import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { FinInvoice, InvoiceStatus } from "../types.js";

export const INVOICE_REPOSITORY = "INVOICE_REPOSITORY";

export interface InvoiceRepository {
  create(invoice: Omit<FinInvoice, "id" | "createdAt" | "updatedAt">): Promise<FinInvoice>;
  update(id: string, data: Partial<FinInvoice>): Promise<FinInvoice>;
  findById(id: string, organizationId?: string): Promise<FinInvoice | null>;
  findByOrganization(organizationId: string, status?: InvoiceStatus): Promise<FinInvoice[]>;
  delete(id: string, organizationId: string): Promise<void>;
}

@Injectable()
export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available");
    }
    return this.prisma;
  }

  async create(invoice: Omit<FinInvoice, "id" | "createdAt" | "updatedAt">): Promise<FinInvoice> {
    const data = {
      ...invoice,
      dueDate: new Date(invoice.dueDate),
    };
    const created = await this.db.finInvoice.create({ data });
    return this.fromRow({ ...data, ...created });
  }

  async update(id: string, data: Partial<FinInvoice>): Promise<FinInvoice> {
    const updated = await this.db.finInvoice.update({
      where: { id },
      data: {
        ...(data as any),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
      },
    });
    return this.fromRow({ ...(data as any), ...updated });
  }

  async findById(id: string, organizationId?: string): Promise<FinInvoice | null> {
    const row = await this.db.finInvoice.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromRow(row);
  }

  async findByOrganization(organizationId: string, status?: InvoiceStatus): Promise<FinInvoice[]> {
    const rows = await this.db.finInvoice.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => this.fromRow(row));
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.db.finInvoice.delete({
      where: { id, organizationId },
    });
  }

  private fromRow(row: any): FinInvoice {
    return {
      ...row,
      dueDate: row.dueDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class InMemoryInvoiceRepository implements InvoiceRepository {
  private invoices = new Map<string, FinInvoice>();

  async create(invoice: Omit<FinInvoice, "id" | "createdAt" | "updatedAt">): Promise<FinInvoice> {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const created: FinInvoice = {
      ...invoice,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.invoices.set(id, created);
    return created;
  }

  async update(id: string, data: Partial<FinInvoice>): Promise<FinInvoice> {
    const existing = this.invoices.get(id);
    if (!existing) throw new Error("Invoice not found");
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.invoices.set(id, updated);
    return updated;
  }

  async findById(id: string, organizationId?: string): Promise<FinInvoice | null> {
    const i = this.invoices.get(id);
    if (!i) return null;
    if (organizationId && i.organizationId !== organizationId) return null;
    return i;
  }

  async findByOrganization(organizationId: string, status?: InvoiceStatus): Promise<FinInvoice[]> {
    return Array.from(this.invoices.values())
      .filter((i) => i.organizationId === organizationId && (!status || i.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const i = this.invoices.get(id);
    if (i && i.organizationId === organizationId) {
      this.invoices.delete(id);
    }
  }
}
