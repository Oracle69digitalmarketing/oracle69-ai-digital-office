var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { MessageBus, TenantContextService } from "@oracle69/runtime";
import { CrmOpportunityRepository } from '../repositories/crm-opportunity.repository.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';
let CrmOpportunityService = class CrmOpportunityService {
    repository;
    messageBus;
    tenantContext;
    constructor(repository, messageBus, tenantContext) {
        this.repository = repository;
        this.messageBus = messageBus;
        this.tenantContext = tenantContext;
    }
    // Opportunity Methods
    async createOpportunity(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const opportunity = await this.repository.createOpportunity({ ...data, organizationId: tenantId });
        this.messageBus.publish(CrmEventType.OPPORTUNITY_CREATED, new CrmEvent(CrmEventType.OPPORTUNITY_CREATED, { opportunity }), { tenantId });
        return opportunity;
    }
    async updateOpportunity(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const oldOpportunity = await this.repository.findOpportunityById(id, tenantId);
        const opportunity = await this.repository.updateOpportunity(id, tenantId, data);
        this.messageBus.publish(CrmEventType.OPPORTUNITY_UPDATED, new CrmEvent(CrmEventType.OPPORTUNITY_UPDATED, { opportunity }), { tenantId });
        if (data.stage && oldOpportunity?.stage !== data.stage) {
            this.messageBus.publish(CrmEventType.OPPORTUNITY_STAGE_CHANGED, new CrmEvent(CrmEventType.OPPORTUNITY_STAGE_CHANGED, {
                opportunityId: id,
                oldStage: oldOpportunity?.stage,
                newStage: data.stage
            }), { tenantId });
            if (data.stage === 'won') {
                this.messageBus.publish(CrmEventType.OPPORTUNITY_WON, new CrmEvent(CrmEventType.OPPORTUNITY_WON, { opportunityId: id }), { tenantId });
            }
            else if (data.stage === 'lost') {
                this.messageBus.publish(CrmEventType.OPPORTUNITY_LOST, new CrmEvent(CrmEventType.OPPORTUNITY_LOST, { opportunityId: id }), { tenantId });
            }
        }
        return opportunity;
    }
    async deleteOpportunity(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        const opportunity = await this.repository.deleteOpportunity(id, tenantId);
        this.messageBus.publish(CrmEventType.OPPORTUNITY_DELETED, new CrmEvent(CrmEventType.OPPORTUNITY_DELETED, { opportunityId: id }), { tenantId });
        return opportunity;
    }
    async getOpportunity(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.findOpportunityById(id, tenantId);
    }
    async listOpportunities(organizationId) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        return this.repository.findOpportunitiesByOrganization(tenantId);
    }
    // Pipeline Methods
    async createPipeline(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        return this.repository.createPipeline({ ...data, organizationId: tenantId });
    }
    async updatePipeline(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        return this.repository.updatePipeline(id, tenantId, data);
    }
    async deletePipeline(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.deletePipeline(id, tenantId);
    }
    async getPipeline(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.findPipelineById(id, tenantId);
    }
    async listPipelines(organizationId) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        return this.repository.findAllPipelines(tenantId);
    }
    // Pipeline Stage Methods
    async createPipelineStage(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        return this.repository.createPipelineStage({ ...data, organizationId: tenantId });
    }
    async updatePipelineStage(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        return this.repository.updatePipelineStage(id, tenantId, data);
    }
    async deletePipelineStage(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.deletePipelineStage(id, tenantId);
    }
};
CrmOpportunityService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CrmOpportunityRepository,
        MessageBus,
        TenantContextService])
], CrmOpportunityService);
export { CrmOpportunityService };
