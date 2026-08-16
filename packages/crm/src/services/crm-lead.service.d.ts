import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { CrmLeadRepository } from "../repositories/crm-lead.repository.js";
import { CreateCrmLeadDto, UpdateCrmLeadDto } from "../dto/crm.dto.js";
export declare class CrmLeadService {
  private readonly repository;
  private readonly messageBus;
  private readonly tenantContext;
  constructor(
    repository: CrmLeadRepository,
    messageBus: MessageBus,
    tenantContext: TenantContextService,
  );
  createLead(data: CreateCrmLeadDto): Promise<{
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
  }>;
  updateLead(
    id: string,
    data: UpdateCrmLeadDto & {
      organizationId?: string;
    },
  ): Promise<{
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
  }>;
  deleteLead(id: string): Promise<{
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
  }>;
  getLead(id: string): Promise<
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
        status: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        source: string | null;
        title: string | null;
        ownerId: string | null;
        crmOrganizationId: string | null;
        score: number | null;
      })
    | null
  >;
  listLeads(organizationId?: string): Promise<
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
      status: string;
      organizationId: string;
      createdAt: Date;
      updatedAt: Date;
      source: string | null;
      title: string | null;
      ownerId: string | null;
      crmOrganizationId: string | null;
      score: number | null;
    })[]
  >;
}
//# sourceMappingURL=crm-lead.service.d.ts.map
