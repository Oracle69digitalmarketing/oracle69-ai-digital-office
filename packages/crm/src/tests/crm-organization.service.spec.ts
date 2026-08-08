import { jest } from '@jest/globals';
import { CrmOrganizationService } from '../services/crm-organization.service.js';
import { CrmOrganizationRepository } from '../repositories/crm-organization.repository.js';
import { MessageBus } from '@oracle69/runtime';
import { CrmEventType } from '../events/crm.events.js';

describe('CrmOrganizationService', () => {
  let service: CrmOrganizationService;
  let repository: jest.Mocked<CrmOrganizationRepository>;
  let messageBus: jest.Mocked<MessageBus>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
    } as any;

    messageBus = {
      publish: jest.fn(),
    } as any;

    service = new CrmOrganizationService(repository, messageBus);
  });

  it('should create an organization and publish an event', async () => {
    const dto = { name: 'Acme Corp', organizationId: 'org-1' };
    const createdOrg = { id: 'crm-org-1', ...dto, createdAt: new Date(), updatedAt: new Date(), industry: null, employees: null, revenue: null, website: null, address: null, city: null, country: null, status: 'active' };
    
    repository.create.mockResolvedValue(createdOrg as any);

    const result = await service.createOrganization(dto);

    expect(result).toEqual(createdOrg);
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(messageBus.publish).toHaveBeenCalledWith(
      CrmEventType.ORGANIZATION_CREATED,
      expect.objectContaining({
        type: CrmEventType.ORGANIZATION_CREATED,
        payload: { organization: createdOrg }
      })
    );
  });
});
