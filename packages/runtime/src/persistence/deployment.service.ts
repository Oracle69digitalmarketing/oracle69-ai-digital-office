import { Inject, Injectable } from "@nestjs/common";
import { TenantContextService, TenantContextError } from "../tenancy/tenant-context.js";
import type { Deployment, DeploymentInput, DeploymentRepository } from "./deployment.repository.js";
import { DEPLOYMENT_REPOSITORY } from "./deployment.repository.js";

/**
 * Tenant-scoped deployment retrieval and registration.
 *
 * Every deployment operation is scoped to the tenant/organization it belongs
 * to. The tenant is resolved from the explicit input, falling back to the
 * active {@link TenantContextService} scope; when no tenant can be resolved a
 * {@link TenantContextError} is thrown, enforcing tenant isolation.
 */
@Injectable()
export class DeploymentService {
  constructor(
    @Inject(DEPLOYMENT_REPOSITORY) private readonly repository: DeploymentRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Registers a new deployment for a tenant.
   */
  async registerDeployment(input: DeploymentInput): Promise<Deployment> {
    const tenantId = this.tenantContext.resolveTenantId(input.tenantId);
    return this.repository.register({ ...input, tenantId });
  }

  /**
   * Retrieves a deployment by id, constrained to the tenant.
   */
  async getDeployment(id: string, tenantId?: string): Promise<Deployment | null> {
    const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
    return this.repository.findById(id, resolvedTenant);
  }

  /**
   * Lists every deployment registered for a tenant.
   */
  async listDeployments(tenantId?: string, status?: string): Promise<Deployment[]> {
    const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
    return this.repository.findByTenant(resolvedTenant, status);
  }

  /**
   * Returns the active deployment for a tenant, if one exists.
   */
  async getActiveDeployment(tenantId?: string): Promise<Deployment | null> {
    const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
    return this.repository.findActive(resolvedTenant);
  }

  /**
   * Updates the status of a tenant-scoped deployment.
   */
  async updateDeploymentStatus(id: string, status: string, tenantId?: string): Promise<Deployment> {
    const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
    return this.repository.updateStatus(id, status, resolvedTenant);
  }
}
