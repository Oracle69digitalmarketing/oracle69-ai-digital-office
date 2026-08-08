import { Module } from '@nestjs/common';
import { RuntimeModule } from '@oracle69/runtime';
import { CrmController } from './controllers/crm.controller.js';
import { CrmOrganizationService } from './services/crm-organization.service.js';
import { CrmContactService } from './services/crm-contact.service.js';
import { CrmLeadService } from './services/crm-lead.service.js';
import { CrmOpportunityService } from './services/crm-opportunity.service.js';
import { CrmActivityService } from './services/crm-activity.service.js';
import { CrmAiService } from './services/crm-ai.service.js';
import { CrmOrganizationRepository } from './repositories/crm-organization.repository.js';
import { CrmContactRepository } from './repositories/crm-contact.repository.js';
import { CrmLeadRepository } from './repositories/crm-lead.repository.js';
import { CrmOpportunityRepository } from './repositories/crm-opportunity.repository.js';
import { CrmActivityRepository } from './repositories/crm-activity.repository.js';

@Module({
  imports: [RuntimeModule],
  controllers: [CrmController],
  providers: [
    CrmOrganizationService,
    CrmContactService,
    CrmLeadService,
    CrmOpportunityService,
    CrmActivityService,
    CrmAiService,
    CrmOrganizationRepository,
    CrmContactRepository,
    CrmLeadRepository,
    CrmOpportunityRepository,
    CrmActivityRepository,
  ],
  exports: [
    CrmOrganizationService,
    CrmContactService,
    CrmLeadService,
    CrmOpportunityService,
    CrmActivityService,
    CrmAiService,
  ],
})
export class CrmModule {}
