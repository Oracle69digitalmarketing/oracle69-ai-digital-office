import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { FinBudget, BudgetStatus, BudgetPeriod } from "../types.js";

export const BUDGET_REPOSITORY = "BUDGET_REPOSITORY";

export interface BudgetRepository {
  create(budget: Omit<FinBudget, "id" | "createdAt" | "updatedAt">): Promise<FinBudget>;
  update(id: string, data: Partial<FinBudget>): Promise<FinBudget>;
  findById(id: string, organizationId?: string): Promise<FinBudget | null>;
  findByOrganization(organizationId: string, status?: BudgetStatus): Promise<FinBudget[]>;
  delete(id: string, organizationId: string): Promise<void>;
}

@Injectable()
export class PrismaBudgetRepository implements BudgetRepository {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available");
    }
    return this.prisma;
  }

  async create(budget: Omit<FinBudget, "id" | "createdAt" | "updatedAt">): Promise<FinBudget> {
    const data = {
      ...budget,
      startDate: new Date(budget.startDate),
      endDate: new Date(budget.endDate),
    };
    const created = await this.db.finBudget.create({ data });
    return this.fromRow({ ...data, ...created });
  }

  async update(id: string, data: Partial<FinBudget>): Promise<FinBudget> {
    const updated = await this.db.finBudget.update({
      where: { id },
      data: {
        ...(data as any),
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
      },
    });
    return this.fromRow({ ...(data as any), ...updated });
  }

  async findById(id: string, organizationId?: string): Promise<FinBudget | null> {
    const row = await this.db.finBudget.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromRow(row);
  }

  async findByOrganization(organizationId: string, status?: BudgetStatus): Promise<FinBudget[]> {
    const rows = await this.db.finBudget.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => this.fromRow(row));
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.db.finBudget.delete({
      where: { id, organizationId },
    });
  }

  private fromRow(row: any): FinBudget {
    return {
      ...row,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as FinBudget;
  }
}

@Injectable()
export class InMemoryBudgetRepository implements BudgetRepository {
  private budgets = new Map<string, FinBudget>();

  async create(budget: Omit<FinBudget, "id" | "createdAt" | "updatedAt">): Promise<FinBudget> {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const created: FinBudget = {
      ...budget,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.budgets.set(id, created);
    return created;
  }

  async update(id: string, data: Partial<FinBudget>): Promise<FinBudget> {
    const existing = this.budgets.get(id);
    if (!existing) throw new Error("Budget not found");
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.budgets.set(id, updated);
    return updated;
  }

  async findById(id: string, organizationId?: string): Promise<FinBudget | null> {
    const b = this.budgets.get(id);
    if (!b) return null;
    if (organizationId && b.organizationId !== organizationId) return null;
    return b;
  }

  async findByOrganization(organizationId: string, status?: BudgetStatus): Promise<FinBudget[]> {
    return Array.from(this.budgets.values())
      .filter((b) => b.organizationId === organizationId && (!status || b.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const b = this.budgets.get(id);
    if (b && b.organizationId === organizationId) {
      this.budgets.delete(id);
    }
  }
}
