var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { TenantContextService } from "@oracle69/runtime";
import { CrmOrganizationService } from '../services/crm-organization.service.js';
import { CrmContactService } from '../services/crm-contact.service.js';
import { CrmLeadService } from '../services/crm-lead.service.js';
import { CrmOpportunityService } from '../services/crm-opportunity.service.js';
import { CrmActivityService } from '../services/crm-activity.service.js';
import { CrmAiService } from '../services/crm-ai.service.js';
let CrmController = class CrmController {
    organizationService;
    contactService;
    leadService;
    opportunityService;
    activityService;
    aiService;
    tenantContext;
    constructor(organizationService, contactService, leadService, opportunityService, activityService, aiService, tenantContext) {
        this.organizationService = organizationService;
        this.contactService = contactService;
        this.leadService = leadService;
        this.opportunityService = opportunityService;
        this.activityService = activityService;
        this.aiService = aiService;
        this.tenantContext = tenantContext;
    }
    runInTenant(orgId, fn) {
        return this.tenantContext.run({ tenantId: orgId }, fn);
    }
    // Organizations
    createOrganization(req, dto) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.organizationService.createOrganization({ ...dto, organizationId: orgId }));
    }
    getOrganization(req, id) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.organizationService.getOrganization(id));
    }
    listOrganizations(req) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.organizationService.listOrganizations(orgId));
    }
    // Contacts
    createContact(req, dto) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.contactService.createContact({ ...dto, organizationId: orgId }));
    }
    getContact(req, id) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.contactService.getContact(id));
    }
    listContacts(req) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.contactService.listContacts(orgId));
    }
    // Leads
    createLead(req, dto) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.leadService.createLead({ ...dto, organizationId: orgId }));
    }
    getLead(req, id) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.leadService.getLead(id));
    }
    scoreLead(req, id) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.aiService.scoreLead(id));
    }
    // Opportunities
    createOpportunity(req, dto) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.opportunityService.createOpportunity({ ...dto, organizationId: orgId }));
    }
    getOpportunity(req, id) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.opportunityService.getOpportunity(id));
    }
    predictOpportunity(req, id) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.aiService.predictOpportunityProbability(id));
    }
    // Activities
    createActivity(req, dto) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.activityService.createActivity({ ...dto, organizationId: orgId }));
    }
    summarizeActivity(req, id) {
        const orgId = req.user.organizationId;
        return this.runInTenant(orgId, () => this.aiService.summarizeActivity(id));
    }
};
__decorate([
    Post('organizations'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createOrganization", null);
__decorate([
    Get('organizations/:id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getOrganization", null);
__decorate([
    Get('organizations'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "listOrganizations", null);
__decorate([
    Post('contacts'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createContact", null);
__decorate([
    Get('contacts/:id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getContact", null);
__decorate([
    Get('contacts'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "listContacts", null);
__decorate([
    Post('leads'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createLead", null);
__decorate([
    Get('leads/:id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getLead", null);
__decorate([
    Post('leads/:id/score'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "scoreLead", null);
__decorate([
    Post('opportunities'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createOpportunity", null);
__decorate([
    Get('opportunities/:id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getOpportunity", null);
__decorate([
    Post('opportunities/:id/predict'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "predictOpportunity", null);
__decorate([
    Post('activities'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createActivity", null);
__decorate([
    Post('activities/:id/summarize'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "summarizeActivity", null);
CrmController = __decorate([
    Controller('crm'),
    __metadata("design:paramtypes", [CrmOrganizationService,
        CrmContactService,
        CrmLeadService,
        CrmOpportunityService,
        CrmActivityService,
        CrmAiService,
        TenantContextService])
], CrmController);
export { CrmController };
