import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { TenantContextService } from '@oracle69/runtime';
import { CrmOrganizationService } from '../services/crm-organization.service.js';
import { CrmContactService } from '../services/crm-contact.service.js';
import { CrmLeadService } from '../services/crm-lead.service.js';
import { CrmOpportunityService } from '../services/crm-opportunity.service.js';
import { CrmActivityService } from '../services/crm-activity.service.js';
import { CrmAiService } from '../services/crm-ai.service.js';
import { 
  type CreateCrmOrganizationDto,
  type CreateCrmContactDto,
  type CreateCrmLeadDto,
  type CreateCrmOpportunityDto,
  type CreateCrmActivityDto
} from '../dto/crm.dto.js';

@Controller('crm')
export class CrmController {
  constructor(
    private readonly organizationService: CrmOrganizationService,
    private readonly contactService: CrmContactService,
    private readonly leadService: CrmLeadService,
    private readonly opportunityService: CrmOpportunityService,
    private readonly activityService: CrmActivityService,
    private readonly aiService: CrmAiService,
    private readonly tenantContext: TenantContextService
  ) {}

  private runInTenant<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
    return this.tenantContext.run({ tenantId: orgId }, fn);
  }

  // Organizations
  @Post('organizations')
  createOrganization(@Req() req: any, @Body() dto: CreateCrmOrganizationDto) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.organizationService.createOrganization({ ...dto, organizationId: orgId }));
  }

  @Get('organizations/:id')
  getOrganization(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.organizationService.getOrganization(id));
  }

  @Get('organizations')
  listOrganizations(@Req() req: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.organizationService.listOrganizations(orgId));
  }

  // Contacts
  @Post('contacts')
  createContact(@Req() req: any, @Body() dto: CreateCrmContactDto) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.contactService.createContact({ ...dto, organizationId: orgId }));
  }

  @Get('contacts/:id')
  getContact(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.contactService.getContact(id));
  }

  @Get('contacts')
  listContacts(@Req() req: any) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.contactService.listContacts(orgId));
  }

  // Leads
  @Post('leads')
  createLead(@Req() req: any, @Body() dto: CreateCrmLeadDto) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.leadService.createLead({ ...dto, organizationId: orgId }));
  }

  @Get('leads/:id')
  getLead(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.leadService.getLead(id));
  }

  @Post('leads/:id/score')
  scoreLead(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.aiService.scoreLead(id));
  }

  // Opportunities
  @Post('opportunities')
  createOpportunity(@Req() req: any, @Body() dto: CreateCrmOpportunityDto) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.opportunityService.createOpportunity({ ...dto, organizationId: orgId }));
  }

  @Get('opportunities/:id')
  getOpportunity(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.opportunityService.getOpportunity(id));
  }

  @Post('opportunities/:id/predict')
  predictOpportunity(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.aiService.predictOpportunityProbability(id));
  }

  // Activities
  @Post('activities')
  createActivity(@Req() req: any, @Body() dto: CreateCrmActivityDto) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.activityService.createActivity({ ...dto, organizationId: orgId }));
  }

  @Post('activities/:id/summarize')
  summarizeActivity(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.runInTenant(orgId, () => this.aiService.summarizeActivity(id));
  }
}
