import { jest } from '@jest/globals';
import { CrmContactService } from '../services/crm-contact.service.js';
import { CrmContactRepository } from '../repositories/crm-contact.repository.js';
import { MessageBus } from '@oracle69/runtime';
import { CrmEventType } from '../events/crm.events.js';

describe('CrmContactService', () => {
  let service: CrmContactService;
  let repository: jest.Mocked<CrmContactRepository>;
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

    service = new CrmContactService(repository, messageBus);
  });

  it('should create a contact and publish an event', async () => {
    const dto = { firstName: 'John', lastName: 'Doe', organizationId: 'org-1' };
    const createdContact = { id: 'contact-1', ...dto, createdAt: new Date(), updatedAt: new Date(), email: null, phone: null, jobTitle: null, source: null, tags: [], status: 'active', crmOrganizationId: null, ownerId: null };
    
    repository.create.mockResolvedValue(createdContact as any);

    const result = await service.createContact(dto);

    expect(result).toEqual(createdContact);
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(messageBus.publish).toHaveBeenCalledWith(
      CrmEventType.CONTACT_CREATED,
      expect.objectContaining({
        type: CrmEventType.CONTACT_CREATED,
        payload: { contact: createdContact }
      })
    );
  });
});
