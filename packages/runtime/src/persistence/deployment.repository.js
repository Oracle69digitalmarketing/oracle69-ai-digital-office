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
import { Inject, Injectable, Optional } from '@nestjs/common';
/** Nest DI token for the {@link DeploymentRepository} contract. */
export const DEPLOYMENT_REPOSITORY = 'DEPLOYMENT_REPOSITORY';
/**
 * In-memory deployment repository used for tests and standalone runtimes.
 */
let InMemoryDeploymentRepository = class InMemoryDeploymentRepository {
    deployments = new Map();
    now() {
        return new Date().toISOString();
    }
    clone(d) {
        return { ...d, config: { ...d.config } };
    }
    async register(input) {
        const deployment = {
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
    async updateStatus(id, status, tenantId) {
        const existing = this.deployments.get(id);
        if (!existing || existing.tenantId !== tenantId) {
            throw new Error(`Deployment '${id}' not found for tenant '${tenantId}'.`);
        }
        const updated = { ...existing, status, updatedAt: this.now() };
        this.deployments.set(id, updated);
        return this.clone(updated);
    }
    async findById(id, tenantId) {
        const d = this.deployments.get(id);
        if (!d || d.tenantId !== tenantId)
            return null;
        return this.clone(d);
    }
    async findByTenant(tenantId, status) {
        return Array.from(this.deployments.values())
            .filter((d) => d.tenantId === tenantId && (!status || d.status === status))
            .map((d) => this.clone(d));
    }
    async findActive(tenantId) {
        const active = Array.from(this.deployments.values()).filter((d) => d.tenantId === tenantId && d.status === 'active');
        return active.length > 0 ? this.clone(active[0]) : null;
    }
};
InMemoryDeploymentRepository = __decorate([
    Injectable()
], InMemoryDeploymentRepository);
export { InMemoryDeploymentRepository };
/**
 * Prisma-backed deployment repository persisting deployments to the shared
 * `Deployment` table. Every query is constrained to the tenant.
 */
let PrismaDeploymentRepository = class PrismaDeploymentRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get db() {
        if (!this.prisma) {
            throw new Error('PrismaService is not available for the deployment repository.');
        }
        return this.prisma;
    }
    async register(input) {
        const row = await this.db.deployment.create({
            data: {
                name: input.name,
                environment: input.environment ?? 'production',
                status: input.status ?? 'active',
                version: input.version ?? '1.0.0',
                config: (input.config ?? {}),
                organizationId: input.tenantId,
            },
        });
        return this.fromRow(row);
    }
    async updateStatus(id, status, tenantId) {
        const row = await this.db.deployment.update({
            where: { id },
            data: { status },
        });
        const mapped = this.fromRow(row);
        if (mapped.tenantId !== tenantId) {
            throw new Error(`Deployment '${id}' not found for tenant '${tenantId}'.`);
        }
        return mapped;
    }
    async findById(id, tenantId) {
        const row = await this.db.deployment.findFirst({
            where: { id, organizationId: tenantId },
        });
        return row ? this.fromRow(row) : null;
    }
    async findByTenant(tenantId, status) {
        const rows = await this.db.deployment.findMany({
            where: { organizationId: tenantId, ...(status ? { status } : {}) },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((row) => this.fromRow(row));
    }
    async findActive(tenantId) {
        const row = await this.db.deployment.findFirst({
            where: { organizationId: tenantId, status: 'active' },
            orderBy: { createdAt: 'asc' },
        });
        return row ? this.fromRow(row) : null;
    }
    fromRow(row) {
        return {
            id: row.id,
            name: row.name,
            environment: row.environment,
            status: row.status,
            version: row.version,
            config: (row.config ?? {}),
            tenantId: row.organizationId,
            createdAt: new Date(row.createdAt).toISOString(),
            updatedAt: new Date(row.updatedAt).toISOString(),
        };
    }
};
PrismaDeploymentRepository = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, Inject('PrismaService')),
    __metadata("design:paramtypes", [Function])
], PrismaDeploymentRepository);
export { PrismaDeploymentRepository };
