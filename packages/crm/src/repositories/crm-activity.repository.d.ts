import {
  CreateCrmActivityDto,
  UpdateCrmActivityDto,
  CreateCrmNoteDto,
  UpdateCrmNoteDto,
} from "../dto/crm.dto.js";
export declare class CrmActivityRepository {
  private prisma;
  createActivity(
    data: CreateCrmActivityDto & {
      organizationId: string;
    },
  ): Promise<{
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
  }>;
  updateActivity(
    id: string,
    organizationId: string,
    data: UpdateCrmActivityDto,
  ): Promise<{
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
  }>;
  deleteActivity(
    id: string,
    organizationId: string,
  ): Promise<{
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
  }>;
  findActivityById(
    id: string,
    organizationId: string,
  ): Promise<
    | ({
        crmContact: {
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
        } | null;
        crmLead: {
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
        } | null;
        crmOpportunity: {
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
        assignedTo: {
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
      } & {
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
      })
    | null
  >;
  findActivitiesByOrganization(organizationId: string): Promise<
    ({
      crmContact: {
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
      } | null;
      crmLead: {
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
      } | null;
      crmOpportunity: {
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
      } | null;
    } & {
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
    })[]
  >;
  createNote(
    data: CreateCrmNoteDto & {
      organizationId: string;
    },
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    crmOrganizationId: string | null;
    crmContactId: string | null;
    crmLeadId: string | null;
    crmOpportunityId: string | null;
    crmActivityId: string | null;
  }>;
  updateNote(
    id: string,
    organizationId: string,
    data: UpdateCrmNoteDto,
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    crmOrganizationId: string | null;
    crmContactId: string | null;
    crmLeadId: string | null;
    crmOpportunityId: string | null;
    crmActivityId: string | null;
  }>;
  deleteNote(
    id: string,
    organizationId: string,
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    crmOrganizationId: string | null;
    crmContactId: string | null;
    crmLeadId: string | null;
    crmOpportunityId: string | null;
    crmActivityId: string | null;
  }>;
}
//# sourceMappingURL=crm-activity.repository.d.ts.map
