import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { FinTransaction, TransactionStatus, TransactionType } from "../types.js";

export const TRANSACTION_REPOSITORY = "TRANSACTION_REPOSITORY";

export interface TransactionRepository {
  create(
    transaction: Omit<FinTransaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<FinTransaction>;
  update(id: string, data: Partial<FinTransaction>): Promise<FinTransaction>;
  findById(id: string, organizationId?: string): Promise<FinTransaction | null>;
  findByOrganization(
    organizationId: string,
    options?: { type?: TransactionType; status?: TransactionStatus },
  ): Promise<FinTransaction[]>;
  delete(id: string, organizationId: string): Promise<void>;
}

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available");
    }
    return this.prisma;
  }

  async create(
    transaction: Omit<FinTransaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<FinTransaction> {
    const data = {
      ...transaction,
      date: new Date(transaction.date),
    };
    const created = await this.db.finTransaction.create({ data });
    return this.fromRow({ ...data, ...created });
  }

  async update(id: string, data: Partial<FinTransaction>): Promise<FinTransaction> {
    const updated = await this.db.finTransaction.update({
      where: { id },
      data: {
        ...(data as any),
        ...(data.date ? { date: new Date(data.date) } : {}),
      },
    });
    return this.fromRow({ ...(data as any), ...updated });
  }

  async findById(id: string, organizationId?: string): Promise<FinTransaction | null> {
    const row = await this.db.finTransaction.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromRow(row);
  }

  async findByOrganization(
    organizationId: string,
    options?: { type?: TransactionType; status?: TransactionStatus },
  ): Promise<FinTransaction[]> {
    const rows = await this.db.finTransaction.findMany({
      where: {
        organizationId,
        ...(options?.type ? { type: options.type } : {}),
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { date: "desc" },
    });
    return rows.map((row) => this.fromRow(row));
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.db.finTransaction.delete({
      where: { id, organizationId },
    });
  }

  private fromRow(row: any): FinTransaction {
    return {
      ...row,
      date: row.date.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class InMemoryTransactionRepository implements TransactionRepository {
  private transactions = new Map<string, FinTransaction>();

  async create(
    transaction: Omit<FinTransaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<FinTransaction> {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const created: FinTransaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, created);
    return created;
  }

  async update(id: string, data: Partial<FinTransaction>): Promise<FinTransaction> {
    const existing = this.transactions.get(id);
    if (!existing) throw new Error("Transaction not found");
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.transactions.set(id, updated);
    return updated;
  }

  async findById(id: string, organizationId?: string): Promise<FinTransaction | null> {
    const t = this.transactions.get(id);
    if (!t) return null;
    if (organizationId && t.organizationId !== organizationId) return null;
    return t;
  }

  async findByOrganization(
    organizationId: string,
    options?: { type?: TransactionType; status?: TransactionStatus },
  ): Promise<FinTransaction[]> {
    return Array.from(this.transactions.values())
      .filter(
        (t) =>
          t.organizationId === organizationId &&
          (!options?.type || t.type === options.type) &&
          (!options?.status || t.status === options.status),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const t = this.transactions.get(id);
    if (t && t.organizationId === organizationId) {
      this.transactions.delete(id);
    }
  }
}
