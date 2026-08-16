import { CreateCrmContactDto, UpdateCrmContactDto } from "../dto/crm.dto.js";
export declare class CrmContactRepository {
  private prisma;
  create(
    data: CreateCrmContactDto & {
      organizationId: string;
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
  update(
    id: string,
    organizationId: string,
    data: UpdateCrmContactDto,
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
  delete(
    id: string,
    organizationId: string,
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
  findById(
    id: string,
    organizationId: string,
  ): Promise<
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
  findAll(organizationId: string): Promise<
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
  search(
    organizationId: string,
    query: string,
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
//# sourceMappingURL=crm-contact.repository.d.ts.map
