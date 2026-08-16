import { jest } from '@jest/globals';
import { CrmContactService } from '../services/crm-contact.service.js';
import { CrmEventType } from '../events/crm.events.js';
describe('CrmContactService', () => {
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
        service = new CrmContactService(repository, messageBus, tenantContext);
    });
    it('should create a contact and publish an event', async () => {
        const dto = { firstName: 'John', lastName: 'Doe', organizationId: 'org-1' };
        const createdContact = { id: 'contact-1', ...dto, createdAt: new Date(), updatedAt: new Date(), email: null, phone: null, jobTitle: null, source: null, tags: [], status: 'active', crmOrganizationId: null, ownerId: null };
        tenantContext.resolveTenantId.mockReturnValue('org-1');
        repository.create.mockResolvedValue(createdContact);
        const result = await service.createContact(dto);
        expect(result).toEqual(createdContact);
        expect(repository.create).toHaveBeenCalledWith({ ...dto, organizationId: 'org-1' });
        expect(messageBus.publish).toHaveBeenCalledWith(CrmEventType.CONTACT_CREATED, expect.objectContaining({
            type: CrmEventType.CONTACT_CREATED,
            payload: { contact: createdContact }
        }), { tenantId: 'org-1' });
    });
});
