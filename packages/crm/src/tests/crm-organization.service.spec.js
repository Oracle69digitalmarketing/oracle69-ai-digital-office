import { jest } from '@jest/globals';
import { CrmOrganizationService } from '../services/crm-organization.service.js';
import { CrmEventType } from '../events/crm.events.js';
describe('CrmOrganizationService', () => {
    let service;
    let repository;
    let messageBus;
    let tenantContext;
    beforeEach(() => {
        repository = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            search: jest.fn(),
        };
        messageBus = {
            publish: jest.fn(),
        };
        tenantContext = {
            resolveTenantId: jest.fn(),
        };
        service = new CrmOrganizationService(repository, messageBus, tenantContext);
    });
    it('should create an organization and publish an event', async () => {
        const dto = { name: 'Acme Corp', organizationId: 'org-1' };
        const createdOrg = { id: 'crm-org-1', ...dto, createdAt: new Date(), updatedAt: new Date(), industry: null, employees: null, revenue: null, website: null, address: null, city: null, country: null, status: 'active' };
        tenantContext.resolveTenantId.mockReturnValue('org-1');
        repository.create.mockResolvedValue(createdOrg);
        const result = await service.createOrganization(dto);
        expect(result).toEqual(createdOrg);
        expect(repository.create).toHaveBeenCalledWith({ ...dto, id: 'org-1', organizationId: 'org-1' });
        expect(messageBus.publish).toHaveBeenCalledWith(CrmEventType.ORGANIZATION_CREATED, expect.objectContaining({
            type: CrmEventType.ORGANIZATION_CREATED,
            payload: { organization: createdOrg }
        }), { tenantId: 'org-1' });
    });
    it('should list organizations with aggregated data', async () => {
        const mockOrgs = [
            {
                id: 'org-1',
                name: 'Acme Corp',
                industry: 'Tech',
                status: 'active',
                createdAt: new Date('2023-01-01'),
                contacts: [
                    {
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'john@acme.com',
                        createdAt: new Date('2023-01-01'),
                        activities: [{ createdAt: new Date(Date.now() - 3600000) }] // 1 hour ago
                    }
                ]
            }
        ];
        tenantContext.resolveTenantId.mockReturnValue('org-1');
        repository.findAll.mockResolvedValue(mockOrgs);
        const result = await service.listOrganizations('org-1');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Acme Corp');
        expect(result[0].contactPerson).toBe('John Doe');
        expect(result[0].lastActivity).toBe('1 hour ago');
    });
});
