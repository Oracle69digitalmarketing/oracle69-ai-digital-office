import { jest, describe, it, expect } from '@jest/globals';
import { DeploymentService } from '../../persistence/deployment.service.js';
import {
  InMemoryDeploymentRepository,
  PrismaDeploymentRepository,
  DeploymentInput,
} from '../../persistence/deployment.repository.js';
import { TenantContextService, TenantContextError } from '../../tenancy/tenant-context.js';

const deploymentInput = (overrides: Partial<DeploymentInput> = {}): DeploymentInput => ({
  name: 'crm-agent',
  environment: 'production',
  status: 'active',
  version: '2.1.0',
  config: { region: 'us-east' },
  tenantId: 'org-1',
  ...overrides,
});

describe('DeploymentService (tenant-scoped deployment retrieval)', () => {
  it('should register a deployment for a tenant and retrieve it back', async () => {
    const service = new DeploymentService(new InMemoryDeploymentRepository(), new TenantContextService());
    const created = await service.registerDeployment(deploymentInput());
    const fetched = await service.getDeployment(created.id, 'org-1');

    expect(fetched?.name).toBe('crm-agent');
    expect(fetched?.tenantId).toBe('org-1');
  });

  it('should never leak deployments across tenants', async () => {
    const service = new DeploymentService(new InMemoryDeploymentRepository(), new TenantContextService());
    const created = await service.registerDeployment(deploymentInput({ tenantId: 'org-a' }));

    expect(await service.getDeployment(created.id, 'org-b')).toBeNull();
    expect(await service.listDeployments('org-b')).toEqual([]);
    expect(await service.getActiveDeployment('org-a')).not.toBeNull();
  });

  it('should resolve the tenant from the active TenantContext scope', async () => {
    const tenantContext = new TenantContextService();
    const service = new DeploymentService(new InMemoryDeploymentRepository(), tenantContext);

    let createdId = '';
    await tenantContext.run({ tenantId: 'org-scope' }, async () => {
      const created = await service.registerDeployment(deploymentInput({ tenantId: undefined as any }));
      createdId = created.id;
      expect(created.tenantId).toBe('org-scope');
    });

    const listed = await service.listDeployments('org-scope');
    expect(listed.map((d) => d.id)).toEqual([createdId]);
  });

  it('should enforce tenant scope by throwing when no tenant is resolvable', async () => {
    const service = new DeploymentService(new InMemoryDeploymentRepository(), new TenantContextService());

    await expect(service.listDeployments()).rejects.toThrow(TenantContextError);
    await expect(service.registerDeployment(deploymentInput({ tenantId: '' as string }))).rejects.toThrow(
      TenantContextError
    );
  });
});

describe('PrismaDeploymentRepository', () => {
  it('should register a deployment scoped to the tenant organization', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'dep-1',
      name: 'crm-agent',
      environment: 'production',
      status: 'active',
      version: '2.1.0',
      config: {},
      organizationId: 'org-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const prisma = { deployment: { create } } as any;
    const repo = new PrismaDeploymentRepository(prisma);

    const created = await repo.register(deploymentInput());

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'crm-agent', organizationId: 'org-1' }),
    });
    expect(created.tenantId).toBe('org-1');
  });

  it('should constrain reads to the tenant organization', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = { deployment: { findFirst } } as any;
    const repo = new PrismaDeploymentRepository(prisma);

    const result = await repo.findById('dep-1', 'org-1');

    expect(findFirst).toHaveBeenCalledWith({ where: { id: 'dep-1', organizationId: 'org-1' } });
    expect(result).toBeNull();
  });
});
