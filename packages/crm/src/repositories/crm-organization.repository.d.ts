import { CreateCrmOrganizationDto, UpdateCrmOrganizationDto } from "../dto/crm.dto.js";
export declare class CrmOrganizationRepository {
  private prisma;
  create(
    data: CreateCrmOrganizationDto & {
      organizationId: string;
    },
  ): Promise<{
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
  }>;
  update(
    id: string,
    organizationId: string,
    data: UpdateCrmOrganizationDto,
  ): Promise<{
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
  }>;
  delete(
    id: string,
    organizationId: string,
  ): Promise<{
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
  }>;
  findById(
    id: string,
    organizationId: string,
  ): Promise<
    | ({
        contacts: {
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
        }[];
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
        leads: {
          id: string;
          status: string;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
          source: string | null;
          title: string | null;
          ownerId: string | null;
          crmOrganizationId: string | null;
          score: number | null;
        }[];
      } & {
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
      })
    | null
  >;
  findAll(organizationId: string): Promise<
    ({
      contacts: ({
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
      })[];
    } & {
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
    })[]
  >;
  search(
    organizationId: string,
    query: string,
  ): Promise<
    {
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
    }[]
  >;
}
//# sourceMappingURL=crm-organization.repository.d.ts.map
