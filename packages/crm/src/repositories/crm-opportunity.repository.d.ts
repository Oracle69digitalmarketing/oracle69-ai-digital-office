import {
  CreateCrmOpportunityDto,
  UpdateCrmOpportunityDto,
  CreateCrmPipelineDto,
  UpdateCrmPipelineDto,
  CreateCrmPipelineStageDto,
  UpdateCrmPipelineStageDto,
} from "../dto/crm.dto.js";
export declare class CrmOpportunityRepository {
  private prisma;
  createOpportunity(
    data: CreateCrmOpportunityDto & {
      organizationId: string;
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
  updateOpportunity(
    id: string,
    organizationId: string,
    data: UpdateCrmOpportunityDto,
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
  deleteOpportunity(
    id: string,
    organizationId: string,
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
  findOpportunityById(
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
  findOpportunitiesByOrganization(organizationId: string): Promise<
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
  createPipeline(
    data: CreateCrmPipelineDto & {
      organizationId: string;
    },
  ): Promise<{
    name: string;
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  updatePipeline(
    id: string,
    organizationId: string,
    data: UpdateCrmPipelineDto,
  ): Promise<{
    name: string;
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  deletePipeline(
    id: string,
    organizationId: string,
  ): Promise<{
    name: string;
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  findPipelineById(
    id: string,
    organizationId: string,
  ): Promise<
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
  findAllPipelines(organizationId: string): Promise<
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
      organizationId: string;
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
    organizationId: string,
    data: UpdateCrmPipelineStageDto,
  ): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    probability: number | null;
    pipelineId: string;
    order: number;
  }>;
  deletePipelineStage(
    id: string,
    organizationId: string,
  ): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    probability: number | null;
    pipelineId: string;
    order: number;
  }>;
}
//# sourceMappingURL=crm-opportunity.repository.d.ts.map
