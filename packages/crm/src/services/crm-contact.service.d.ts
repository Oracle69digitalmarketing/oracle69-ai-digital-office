import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { CrmContactRepository } from "../repositories/crm-contact.repository.js";
import { CreateCrmContactDto, UpdateCrmContactDto } from "../dto/crm.dto.js";
export declare class CrmContactService {
  private readonly repository;
  private readonly messageBus;
  private readonly tenantContext;
  constructor(
    repository: CrmContactRepository,
    messageBus: MessageBus,
    tenantContext: TenantContextService,
  );
  createContact(data: CreateCrmContactDto): Promise<{
    id: string;
    email: string | null;
    status: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    source: string | null;
    ownerId: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    jobTitle: string | null;
    tags: string[];
    crmOrganizationId: string | null;
  }>;
  updateContact(
    id: string,
    data: UpdateCrmContactDto & {
      organizationId?: string;
    },
  ): Promise<{
    id: string;
    email: string | null;
    status: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    source: string | null;
    ownerId: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    jobTitle: string | null;
    tags: string[];
    crmOrganizationId: string | null;
  }>;
  deleteContact(id: string): Promise<{
    id: string;
    email: string | null;
    status: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    source: string | null;
    ownerId: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    jobTitle: string | null;
    tags: string[];
    crmOrganizationId: string | null;
  }>;
  getContact(id: string): Promise<
    | ({
        crmOrganization: {
          name: string;
          id: string;
          status: string;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
          industry: string | null;
          country: string | null;
          employees: number | null;
          revenue: number | null;
          website: string | null;
          address: string | null;
          city: string | null;
          healthScore: number | null;
          lastHealthUpdate: Date | null;
        } | null;
        owner: {
          name: string | null;
          id: string;
          email: string;
          password: string;
          role: string;
          status: string;
          avatar: string | null;
          lastLogin: Date | null;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
        } | null;
        opportunities: {
          name: string;
          id: string;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
          value: number;
          ownerId: string | null;
          crmOrganizationId: string | null;
          stage: string;
          probability: number | null;
          expectedCloseDate: Date | null;
          pipelineId: string;
        }[];
        notes: {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          content: string;
          crmOrganizationId: string | null;
          crmContactId: string | null;
          crmLeadId: string | null;
          crmOpportunityId: string | null;
          crmActivityId: string | null;
        }[];
        activities: {
          id: string;
          status: string;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
          type: string;
          description: string | null;
          subject: string;
          dueDate: Date | null;
          crmContactId: string | null;
          crmLeadId: string | null;
          crmOpportunityId: string | null;
          assignedToId: string | null;
        }[];
      } & {
        id: string;
        email: string | null;
        status: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        source: string | null;
        ownerId: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        jobTitle: string | null;
        tags: string[];
        crmOrganizationId: string | null;
      })
    | null
  >;
  listContacts(organizationId?: string): Promise<
    ({
      crmOrganization: {
        name: string;
        id: string;
        status: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        industry: string | null;
        country: string | null;
        employees: number | null;
        revenue: number | null;
        website: string | null;
        address: string | null;
        city: string | null;
        healthScore: number | null;
        lastHealthUpdate: Date | null;
      } | null;
    } & {
      id: string;
      email: string | null;
      status: string;
      organizationId: string;
      createdAt: Date;
      updatedAt: Date;
      source: string | null;
      ownerId: string | null;
      firstName: string;
      lastName: string;
      phone: string | null;
      jobTitle: string | null;
      tags: string[];
      crmOrganizationId: string | null;
    })[]
  >;
  searchContacts(
    query: string,
    organizationId?: string,
  ): Promise<
    {
      id: string;
      email: string | null;
      status: string;
      organizationId: string;
      createdAt: Date;
      updatedAt: Date;
      source: string | null;
      ownerId: string | null;
      firstName: string;
      lastName: string;
      phone: string | null;
      jobTitle: string | null;
      tags: string[];
      crmOrganizationId: string | null;
    }[]
  >;
}
//# sourceMappingURL=crm-contact.service.d.ts.map
