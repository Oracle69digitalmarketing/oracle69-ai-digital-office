import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { CrmOpportunityRepository } from "../repositories/crm-opportunity.repository.js";
import {
  CreateCrmOpportunityDto,
  UpdateCrmOpportunityDto,
  CreateCrmPipelineDto,
  UpdateCrmPipelineDto,
  CreateCrmPipelineStageDto,
  UpdateCrmPipelineStageDto,
} from "../dto/crm.dto.js";
export declare class CrmOpportunityService {
  private readonly repository;
  private readonly messageBus;
  private readonly tenantContext;
  constructor(
    repository: CrmOpportunityRepository,
    messageBus: MessageBus,
    tenantContext: TenantContextService,
  );
  createOpportunity(data: CreateCrmOpportunityDto): Promise<{
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
  }>;
  updateOpportunity(
    id: string,
    data: UpdateCrmOpportunityDto & {
      organizationId?: string;
    },
  ): Promise<{
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
  }>;
  deleteOpportunity(id: string): Promise<{
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
  }>;
  getOpportunity(id: string): Promise<
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
        pipeline: {
          name: string;
          id: string;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
        };
      } & {
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
      })
    | null
  >;
  listOpportunities(organizationId?: string): Promise<
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
      pipeline: {
        name: string;
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
      };
    } & {
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
    })[]
  >;
  createPipeline(data: CreateCrmPipelineDto): Promise<{
    name: string;
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  updatePipeline(
    id: string,
    data: UpdateCrmPipelineDto & {
      organizationId?: string;
    },
  ): Promise<{
    name: string;
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  deletePipeline(id: string): Promise<{
    name: string;
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  getPipeline(id: string): Promise<
    | ({
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
        stages: {
          name: string;
          id: string;
          createdAt: Date;
          updatedAt: Date;
          probability: number | null;
          pipelineId: string;
          order: number;
        }[];
      } & {
        name: string;
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
      })
    | null
  >;
  listPipelines(organizationId?: string): Promise<
    ({
      stages: {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        probability: number | null;
        pipelineId: string;
        order: number;
      }[];
    } & {
      name: string;
      id: string;
      organizationId: string;
      createdAt: Date;
      updatedAt: Date;
    })[]
  >;
  createPipelineStage(
    data: CreateCrmPipelineStageDto & {
      organizationId?: string;
    },
  ): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    probability: number | null;
    pipelineId: string;
    order: number;
  }>;
  updatePipelineStage(
    id: string,
    data: UpdateCrmPipelineStageDto & {
      organizationId?: string;
    },
  ): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    probability: number | null;
    pipelineId: string;
    order: number;
  }>;
  deletePipelineStage(id: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    probability: number | null;
    pipelineId: string;
    order: number;
  }>;
}
//# sourceMappingURL=crm-opportunity.service.d.ts.map
