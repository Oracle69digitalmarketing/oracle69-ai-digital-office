var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { TenantContextService } from '../tenancy/tenant-context.js';
import { DEPLOYMENT_REPOSITORY } from './deployment.repository.js';
/**
 * Tenant-scoped deployment retrieval and registration.
 *
 * Every deployment operation is scoped to the tenant/organization it belongs
 * to. The tenant is resolved from the explicit input, falling back to the
 * active {@link TenantContextService} scope; when no tenant can be resolved a
 * {@link TenantContextError} is thrown, enforcing tenant isolation.
 */
let DeploymentService = class DeploymentService {
    repository;
    tenantContext;
    constructor(repository, tenantContext) {
        this.repository = repository;
        this.tenantContext = tenantContext;
    }
    /**
     * Registers a new deployment for a tenant.
     */
    async registerDeployment(input) {
        const tenantId = this.tenantContext.resolveTenantId(input.tenantId);
        return this.repository.register({ ...input, tenantId });
    }
    /**
     * Retrieves a deployment by id, constrained to the tenant.
     */
    async getDeployment(id, tenantId) {
        const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
        return this.repository.findById(id, resolvedTenant);
    }
    /**
     * Lists every deployment registered for a tenant.
     */
    async listDeployments(tenantId, status) {
        const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
        return this.repository.findByTenant(resolvedTenant, status);
    }
    /**
     * Returns the active deployment for a tenant, if one exists.
     */
    async getActiveDeployment(tenantId) {
        const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
        return this.repository.findActive(resolvedTenant);
    }
    /**
     * Updates the status of a tenant-scoped deployment.
     */
    async updateDeploymentStatus(id, status, tenantId) {
        const resolvedTenant = this.tenantContext.resolveTenantId(tenantId);
        return this.repository.updateStatus(id, status, resolvedTenant);
    }
};
DeploymentService = __decorate([
    Injectable(),
    __param(0, Inject(DEPLOYMENT_REPOSITORY)),
    __metadata("design:paramtypes", [Object, TenantContextService])
], DeploymentService);
export { DeploymentService };
