import { jest } from '@jest/globals';
import { CrmLeadService } from '../services/crm-lead.service.js';
import { CrmEventType } from '../events/crm.events.js';
describe('CrmLeadService', () => {
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
        };
        messageBus = {
            publish: jest.fn(),
        };
        tenantContext = {
            resolveTenantId: jest.fn(),
        };
        service = new CrmLeadService(repository, messageBus, tenantContext);
    });
    it('should create a lead and publish an event', async () => {
        const dto = { title: 'New Prospect', organizationId: 'org-1' };
        const createdLead = { id: 'lead-1', ...dto, createdAt: new Date(), updatedAt: new Date(), source: null, status: 'new', score: 0, crmOrganizationId: null, ownerId: null };
        tenantContext.resolveTenantId.mockReturnValue('org-1');
        repository.create.mockResolvedValue(createdLead);
        const result = await service.createLead(dto);
        expect(result).toEqual(createdLead);
        expect(messageBus.publish).toHaveBeenCalledWith(CrmEventType.LEAD_CREATED, expect.objectContaining({ type: CrmEventType.LEAD_CREATED }), { tenantId: 'org-1' });
    });
    it('should publish qualified event when status changes to qualified', async () => {
        const updatedLead = { id: 'lead-1', status: 'qualified' };
        tenantContext.resolveTenantId.mockReturnValue('org-1');
        repository.update.mockResolvedValue(updatedLead);
        await service.updateLead('lead-1', { status: 'qualified' });
        expect(messageBus.publish).toHaveBeenCalledWith(CrmEventType.LEAD_QUALIFIED, expect.objectContaining({ type: CrmEventType.LEAD_QUALIFIED, payload: { leadId: 'lead-1' } }), { tenantId: 'org-1' });
    });
});
