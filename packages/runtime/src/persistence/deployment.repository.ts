import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';

/** Nest DI token for the {@link DeploymentRepository} contract. */
export const DEPLOYMENT_REPOSITORY = 'DEPLOYMENT_REPOSITORY';

/**
 * Durable deployment record scoped to a tenant/organization.
 */
export interface Deployment {
  readonly id: string;
  readonly name: string;
  readonly environment: string;
  readonly status: string;
  readonly version: string;
  readonly config: Record<string, unknown>;
  readonly tenantId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Input used to register a new deployment.
 */
export interface DeploymentInput {
  readonly name: string;
  readonly environment?: string;
  readonly status?: string;
  readonly version?: string;
  readonly config?: Record<string, unknown>;
  readonly tenantId: string;
}

/**
 * Deployment repository contract. All reads are tenant-scoped so deployments
 * can never leak across organizations.
 */
export interface DeploymentRepository {
  register(input: DeploymentInput): Promise<Deployment>;
  updateStatus(id: string, status: string, tenantId: string): Promise<Deployment>;
  findById(id: string, tenantId: string): Promise<Deployment | null>;
  findByTenant(tenantId: string, status?: string): Promise<Deployment[]>;
  findActive(tenantId: string): Promise<Deployment | null>;
}

/**
 * In-memory deployment repository used for tests and standalone runtimes.
 */
@Injectable()
export class InMemoryDeploymentRepository implements DeploymentRepository {
  private readonly deployments = new Map<string, Deployment>();

  private now(): string {
    return new Date().toISOString();
  }

  private clone(d: Deployment): Deployment {
    return { ...d, config: { ...d.config } };
  }

  async register(input: DeploymentInput): Promise<Deployment> {
    const deployment: Deployment = {
      id: `dep-${this.deployments.size + 1}`,
      name: input.name,
      environment: input.environment ?? 'production',
      status: input.status ?? 'active',
      version: input.version ?? '1.0.0',
      config: input.config ?? {},
      tenantId: input.tenantId,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.deployments.set(deployment.id, deployment);
    return this.clone(deployment);
  }

  async updateStatus(id: string, status: string, tenantId: string): Promise<Deployment> {
    const existing = this.deployments.get(id);
    if (!existing || existing.tenantId !== tenantId) {
      throw new Error(`Deployment '${id}' not found for tenant '${tenantId}'.`);
    }
    const updated: Deployment = { ...existing, status, updatedAt: this.now() };
    this.deployments.set(id, updated);
    return this.clone(updated);
  }

  async findById(id: string, tenantId: string): Promise<Deployment | null> {
    const d = this.deployments.get(id);
    if (!d || d.tenantId !== tenantId) return null;
    return this.clone(d);
  }

  async findByTenant(tenantId: string, status?: string): Promise<Deployment[]> {
    return Array.from(this.deployments.values())
      .filter((d) => d.tenantId === tenantId && (!status || d.status === status))
      .map((d) => this.clone(d));
  }

  async findActive(tenantId: string): Promise<Deployment | null> {
    const active = Array.from(this.deployments.values()).filter(
      (d) => d.tenantId === tenantId && d.status === 'active'
    );
    return active.length > 0 ? this.clone(active[0]) : null;
  }
}

/**
 * Prisma-backed deployment repository persisting deployments to the shared
 * `Deployment` table. Every query is constrained to the tenant.
 */
@Injectable()
export class PrismaDeploymentRepository implements DeploymentRepository {
  constructor(@Optional() @Inject('PrismaService') private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error('PrismaService is not available for the deployment repository.');
    }
    return this.prisma;
  }

  async register(input: DeploymentInput): Promise<Deployment> {
    const row = await this.db.deployment.create({
      data: {
        name: input.name,
        environment: input.environment ?? 'production',
        status: input.status ?? 'active',
        version: input.version ?? '1.0.0',
        config: (input.config ?? {}) as object,
        organizationId: input.tenantId,
      },
    });
    return this.fromRow(row as any);
  }

  async updateStatus(id: string, status: string, tenantId: string): Promise<Deployment> {
    const row = await this.db.deployment.update({
      where: { id },
      data: { status },
    });
    const mapped = this.fromRow(row as any);
    if (mapped.tenantId !== tenantId) {
      throw new Error(`Deployment '${id}' not found for tenant '${tenantId}'.`);
    }
    return mapped;
  }

  async findById(id: string, tenantId: string): Promise<Deployment | null> {
    const row = await this.db.deployment.findFirst({
      where: { id, organizationId: tenantId },
    });
    return row ? this.fromRow(row as any) : null;
  }

  async findByTenant(tenantId: string, status?: string): Promise<Deployment[]> {
    const rows = await this.db.deployment.findMany({
      where: { organizationId: tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row: unknown) => this.fromRow(row as any));
  }

  async findActive(tenantId: string): Promise<Deployment | null> {
    const row = await this.db.deployment.findFirst({
      where: { organizationId: tenantId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
    return row ? this.fromRow(row as any) : null;
  }

  private fromRow(row: any): Deployment {
    return {
      id: row.id,
      name: row.name,
      environment: row.environment,
      status: row.status,
      version: row.version,
      config: (row.config ?? {}) as Record<string, unknown>,
      tenantId: row.organizationId,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }
}
