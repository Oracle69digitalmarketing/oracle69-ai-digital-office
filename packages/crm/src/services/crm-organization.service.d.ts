import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { CrmOrganizationRepository } from "../repositories/crm-organization.repository.js";
import {
  CreateCrmOrganizationDto,
  UpdateCrmOrganizationDto,
  CrmDashboardOrganizationDto,
} from "../dto/crm.dto.js";
export declare class CrmOrganizationService {
  private readonly repository;
  private readonly messageBus;
  private readonly tenantContext;
  constructor(
    repository: CrmOrganizationRepository,
    messageBus: MessageBus,
    tenantContext: TenantContextService,
  );
  createOrganization(data: CreateCrmOrganizationDto): Promise<{
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
  updateOrganization(
    id: string,
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
  deleteOrganization(id: string): Promise<{
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
  getOrganization(id: string): Promise<
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
  listOrganizations(organizationId: string): Promise<CrmDashboardOrganizationDto[]>;
  private formatDate;
  searchOrganizations(
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
//# sourceMappingURL=crm-organization.service.d.ts.map
