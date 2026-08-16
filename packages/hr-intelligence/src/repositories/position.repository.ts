import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { HrPosition, PositionStatus } from "../types.js";

export const HR_POSITION_REPOSITORY = "HR_POSITION_REPOSITORY";

export interface PositionRepository {
  create(position: Omit<HrPosition, "id" | "createdAt" | "updatedAt">): Promise<HrPosition>;
  update(id: string, data: Partial<HrPosition>): Promise<HrPosition>;
  findById(id: string, organizationId?: string): Promise<HrPosition | null>;
  findByOrganization(organizationId: string, status?: PositionStatus): Promise<HrPosition[]>;
}

@Injectable()
export class PrismaPositionRepository implements PositionRepository {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available");
    }
    return this.prisma;
  }

  async create(position: Omit<HrPosition, "id" | "createdAt" | "updatedAt">): Promise<HrPosition> {
    const created = await this.db.hrPosition.create({ data: position });
    return this.fromRow(created);
  }

  async update(id: string, data: Partial<HrPosition>): Promise<HrPosition> {
    const updated = await this.db.hrPosition.update({
      where: { id },
      data: data as any,
    });
    return this.fromRow({ ...(data as any), ...updated });
  }

  async findById(id: string, organizationId?: string): Promise<HrPosition | null> {
    const row = await this.db.hrPosition.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromRow(row);
  }

  async findByOrganization(organizationId: string, status?: PositionStatus): Promise<HrPosition[]> {
    const rows = await this.db.hrPosition.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => this.fromRow(row));
  }

  private fromRow(row: any): HrPosition {
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class InMemoryPositionRepository implements PositionRepository {
  private positions = new Map<string, HrPosition>();

  async create(position: Omit<HrPosition, "id" | "createdAt" | "updatedAt">): Promise<HrPosition> {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const created: HrPosition = {
      ...position,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.positions.set(id, created);
    return created;
  }

  async update(id: string, data: Partial<HrPosition>): Promise<HrPosition> {
    const existing = this.positions.get(id);
    if (!existing) throw new Error("Position not found");
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.positions.set(id, updated);
    return updated;
  }

  async findById(id: string, organizationId?: string): Promise<HrPosition | null> {
    const p = this.positions.get(id);
    if (!p) return null;
    if (organizationId && p.organizationId !== organizationId) return null;
    return p;
  }

  async findByOrganization(organizationId: string, status?: PositionStatus): Promise<HrPosition[]> {
    return Array.from(this.positions.values())
      .filter((p) => p.organizationId === organizationId && (!status || p.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
