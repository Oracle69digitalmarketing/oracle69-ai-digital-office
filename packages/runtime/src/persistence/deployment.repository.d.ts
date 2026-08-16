import type { PrismaClient } from "@prisma/client";
/** Nest DI token for the {@link DeploymentRepository} contract. */
export declare const DEPLOYMENT_REPOSITORY = "DEPLOYMENT_REPOSITORY";
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
export declare class InMemoryDeploymentRepository implements DeploymentRepository {
  private readonly deployments;
  private now;
  private clone;
  register(input: DeploymentInput): Promise<Deployment>;
  updateStatus(id: string, status: string, tenantId: string): Promise<Deployment>;
  findById(id: string, tenantId: string): Promise<Deployment | null>;
  findByTenant(tenantId: string, status?: string): Promise<Deployment[]>;
  findActive(tenantId: string): Promise<Deployment | null>;
}
/**
 * Prisma-backed deployment repository persisting deployments to the shared
 * `Deployment` table. Every query is constrained to the tenant.
 */
export declare class PrismaDeploymentRepository implements DeploymentRepository {
  private readonly prisma?;
  constructor(prisma?: PrismaClient | undefined);
  private get db();
  register(input: DeploymentInput): Promise<Deployment>;
  updateStatus(id: string, status: string, tenantId: string): Promise<Deployment>;
  findById(id: string, tenantId: string): Promise<Deployment | null>;
  findByTenant(tenantId: string, status?: string): Promise<Deployment[]>;
  findActive(tenantId: string): Promise<Deployment | null>;
  private fromRow;
}
//# sourceMappingURL=deployment.repository.d.ts.map
