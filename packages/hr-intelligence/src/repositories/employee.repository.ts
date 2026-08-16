import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { EmployeeStatus, HrEmployee } from "../types.js";

export const HR_EMPLOYEE_REPOSITORY = "HR_EMPLOYEE_REPOSITORY";

export interface EmployeeRepository {
  create(employee: Omit<HrEmployee, "id" | "createdAt" | "updatedAt">): Promise<HrEmployee>;
  update(id: string, data: Partial<HrEmployee>): Promise<HrEmployee>;
  findById(id: string, organizationId?: string): Promise<HrEmployee | null>;
  findByOrganization(organizationId: string, status?: EmployeeStatus): Promise<HrEmployee[]>;
}

@Injectable()
export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available");
    }
    return this.prisma;
  }

  async create(employee: Omit<HrEmployee, "id" | "createdAt" | "updatedAt">): Promise<HrEmployee> {
    const data = {
      ...employee,
      hireDate: new Date(employee.hireDate),
      ...(employee.terminationDate ? { terminationDate: new Date(employee.terminationDate) } : {}),
    };
    const created = await this.db.hrEmployee.create({ data });
    return this.fromRow({ ...data, ...created });
  }

  async update(id: string, data: Partial<HrEmployee>): Promise<HrEmployee> {
    const updated = await this.db.hrEmployee.update({
      where: { id },
      data: {
        ...(data as any),
        ...(data.hireDate ? { hireDate: new Date(data.hireDate) } : {}),
        ...(data.terminationDate ? { terminationDate: new Date(data.terminationDate) } : {}),
      },
    });
    return this.fromRow({ ...(data as any), ...updated });
  }

  async findById(id: string, organizationId?: string): Promise<HrEmployee | null> {
    const row = await this.db.hrEmployee.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromRow(row);
  }

  async findByOrganization(organizationId: string, status?: EmployeeStatus): Promise<HrEmployee[]> {
    const rows = await this.db.hrEmployee.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { hireDate: "desc" },
    });
    return rows.map((row) => this.fromRow(row));
  }

  private fromRow(row: any): HrEmployee {
    return {
      ...row,
      hireDate: row.hireDate.toISOString(),
      ...(row.terminationDate ? { terminationDate: row.terminationDate.toISOString() } : {}),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class InMemoryEmployeeRepository implements EmployeeRepository {
  private employees = new Map<string, HrEmployee>();

  async create(employee: Omit<HrEmployee, "id" | "createdAt" | "updatedAt">): Promise<HrEmployee> {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const created: HrEmployee = {
      ...employee,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.employees.set(id, created);
    return created;
  }

  async update(id: string, data: Partial<HrEmployee>): Promise<HrEmployee> {
    const existing = this.employees.get(id);
    if (!existing) throw new Error("Employee not found");
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.employees.set(id, updated);
    return updated;
  }

  async findById(id: string, organizationId?: string): Promise<HrEmployee | null> {
    const e = this.employees.get(id);
    if (!e) return null;
    if (organizationId && e.organizationId !== organizationId) return null;
    return e;
  }

  async findByOrganization(organizationId: string, status?: EmployeeStatus): Promise<HrEmployee[]> {
    return Array.from(this.employees.values())
      .filter((e) => e.organizationId === organizationId && (!status || e.status === status))
      .sort((a, b) => b.hireDate.localeCompare(a.hireDate));
  }
}
