import { TenantContextService } from "../tenancy/tenant-context.js";
import type { Deployment, DeploymentInput, DeploymentRepository } from "./deployment.repository.js";
/**
 * Tenant-scoped deployment retrieval and registration.
 *
 * Every deployment operation is scoped to the tenant/organization it belongs
 * to. The tenant is resolved from the explicit input, falling back to the
 * active {@link TenantContextService} scope; when no tenant can be resolved a
 * {@link TenantContextError} is thrown, enforcing tenant isolation.
 */
export declare class DeploymentService {
  private readonly repository;
  private readonly tenantContext;
  constructor(repository: DeploymentRepository, tenantContext: TenantContextService);
  /**
   * Registers a new deployment for a tenant.
   */
  registerDeployment(input: DeploymentInput): Promise<Deployment>;
  /**
   * Retrieves a deployment by id, constrained to the tenant.
   */
  getDeployment(id: string, tenantId?: string): Promise<Deployment | null>;
  /**
   * Lists every deployment registered for a tenant.
   */
  listDeployments(tenantId?: string, status?: string): Promise<Deployment[]>;
  /**
   * Returns the active deployment for a tenant, if one exists.
   */
  getActiveDeployment(tenantId?: string): Promise<Deployment | null>;
  /**
   * Updates the status of a tenant-scoped deployment.
   */
  updateDeploymentStatus(id: string, status: string, tenantId?: string): Promise<Deployment>;
}
//# sourceMappingURL=deployment.service.d.ts.map
