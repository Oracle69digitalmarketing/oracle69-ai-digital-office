import { TenantContextService } from "@oracle69/runtime";
import { CrmOrganizationService } from "../services/crm-organization.service.js";
import { CrmContactService } from "../services/crm-contact.service.js";
import { CrmLeadService } from "../services/crm-lead.service.js";
import { CrmOpportunityService } from "../services/crm-opportunity.service.js";
import { CrmActivityService } from "../services/crm-activity.service.js";
import { CrmAiService } from "../services/crm-ai.service.js";
import {
  type CreateCrmOrganizationDto,
  type CreateCrmContactDto,
  type CreateCrmLeadDto,
  type CreateCrmOpportunityDto,
  type CreateCrmActivityDto,
} from "../dto/crm.dto.js";
export declare class CrmController {
  private readonly organizationService;
  private readonly contactService;
  private readonly leadService;
  private readonly opportunityService;
  private readonly activityService;
  private readonly aiService;
  private readonly tenantContext;
  constructor(
    organizationService: CrmOrganizationService,
    contactService: CrmContactService,
    leadService: CrmLeadService,
    opportunityService: CrmOpportunityService,
    activityService: CrmActivityService,
    aiService: CrmAiService,
    tenantContext: TenantContextService,
  );
  private runInTenant;
  createOrganization(
    req: any,
    dto: CreateCrmOrganizationDto,
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
  getOrganization(
    req: any,
    id: string,
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
  listOrganizations(req: any): Promise<import("../dto/crm.dto.js").CrmDashboardOrganizationDto[]>;
  createContact(
    req: any,
    dto: CreateCrmContactDto,
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
  getContact(
    req: any,
    id: string,
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
  listContacts(req: any): Promise<
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
  createLead(
    req: any,
    dto: CreateCrmLeadDto,
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
  getLead(
    req: any,
    id: string,
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
  scoreLead(req: any, id: string): Promise<any>;
  createOpportunity(
    req: any,
    dto: CreateCrmOpportunityDto,
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
  getOpportunity(
    req: any,
    id: string,
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
  predictOpportunity(req: any, id: string): Promise<any>;
  createActivity(
    req: any,
    dto: CreateCrmActivityDto,
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
  summarizeActivity(req: any, id: string): Promise<any>;
}
//# sourceMappingURL=crm.controller.d.ts.map
