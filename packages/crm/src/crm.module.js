var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RuntimeModule } from "@oracle69/runtime";
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
let CrmModule = class CrmModule {
};
CrmModule = __decorate([
    Module({
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
], CrmModule);
export { CrmModule };
