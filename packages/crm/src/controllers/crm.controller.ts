import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CrmOrganizationService } from '../services/crm-organization.service.js';
import { CrmContactService } from '../services/crm-contact.service.js';
import { CrmLeadService } from '../services/crm-lead.service.js';
import { CrmOpportunityService } from '../services/crm-opportunity.service.js';
import { CrmActivityService } from '../services/crm-activity.service.js';
import { CrmAiService } from '../services/crm-ai.service.js';
import { 
  type CreateCrmOrganizationDto, type UpdateCrmOrganizationDto,
  type CreateCrmContactDto, type UpdateCrmContactDto,
  type CreateCrmLeadDto, type UpdateCrmLeadDto,
  type CreateCrmOpportunityDto, type UpdateCrmOpportunityDto,
  type CreateCrmActivityDto, type UpdateCrmActivityDto
} from '../dto/crm.dto.js';

@Controller('crm')
export class CrmController {
  constructor(
    private readonly organizationService: CrmOrganizationService,
    private readonly contactService: CrmContactService,
    private readonly leadService: CrmLeadService,
    private readonly opportunityService: CrmOpportunityService,
    private readonly activityService: CrmActivityService,
    private readonly aiService: CrmAiService
  ) {}

  // Organizations
  @Post('organizations')
  createOrganization(@Body() dto: CreateCrmOrganizationDto) {
    return this.organizationService.createOrganization(dto);
  }

  @Get('organizations/:id')
  getOrganization(@Param('id') id: string) {
    return this.organizationService.getOrganization(id);
  }

  @Get('organizations')
  listOrganizations(@Query('organizationId') orgId: string) {
    return this.organizationService.listOrganizations(orgId);
  }

  // Contacts
  @Post('contacts')
  createContact(@Body() dto: CreateCrmContactDto) {
    return this.contactService.createContact(dto);
  }

  @Get('contacts/:id')
  getContact(@Param('id') id: string) {
    return this.contactService.getContact(id);
  }

  @Get('contacts')
  listContacts(@Query('organizationId') orgId: string) {
    return this.contactService.listContacts(orgId);
  }

  // Leads
  @Post('leads')
  createLead(@Body() dto: CreateCrmLeadDto) {
    return this.leadService.createLead(dto);
  }

  @Get('leads/:id')
  getLead(@Param('id') id: string) {
    return this.leadService.getLead(id);
  }

  @Post('leads/:id/score')
  scoreLead(@Param('id') id: string) {
    return this.aiService.scoreLead(id);
  }

  // Opportunities
  @Post('opportunities')
  createOpportunity(@Body() dto: CreateCrmOpportunityDto) {
    return this.opportunityService.createOpportunity(dto);
  }

  @Get('opportunities/:id')
  getOpportunity(@Param('id') id: string) {
    return this.opportunityService.getOpportunity(id);
  }

  @Post('opportunities/:id/predict')
  predictOpportunity(@Param('id') id: string) {
    return this.aiService.predictOpportunityProbability(id);
  }

  // Activities
  @Post('activities')
  createActivity(@Body() dto: CreateCrmActivityDto) {
    return this.activityService.createActivity(dto);
  }

  @Post('activities/:id/summarize')
  summarizeActivity(@Param('id') id: string) {
    return this.aiService.summarizeActivity(id);
  }
}
