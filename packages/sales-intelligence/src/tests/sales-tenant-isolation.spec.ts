import { jest } from '@jest/globals';
import { RelationshipIntelligenceEngine } from '../relationship-intelligence/relationship.engine.js';
import { TenantContextService } from '@oracle69/runtime';

describe('SalesTenantIsolation', () => {
  let engine: RelationshipIntelligenceEngine;
  let tenantContext: jest.Mocked<TenantContextService>;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
        crmOrganization: { findFirst: jest.fn() },
        crmOpportunity: { findFirst: jest.fn() }
    };
    tenantContext = {
      resolveTenantId: jest.fn(),
    } as any;

    engine = new RelationshipIntelligenceEngine({ analyze: jest.fn() }, tenantContext);
    (engine as any).prisma = prismaMock;
  });

  it('should restrict account relationship analysis to the active tenant', async () => {
    const tenantA = 'tenant-a';
    const accountId = 'acc-1';
    
    tenantContext.resolveTenantId.mockReturnValue(tenantA);
    prismaMock.crmOrganization.findFirst.mockResolvedValue(null); // Simulate not found for wrong tenant scenario

    // When querying for accountId in tenantA
    await engine.getRelationshipIntelligence('account', accountId);

    expect(prismaMock.crmOrganization.findFirst).toHaveBeenCalledWith({
      where: { id: accountId, organizationId: tenantA },
      include: expect.any(Object)
    });
  });
});
