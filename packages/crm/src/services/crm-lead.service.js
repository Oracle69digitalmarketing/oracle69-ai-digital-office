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
import { CrmLeadRepository } from '../repositories/crm-lead.repository.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';
let CrmLeadService = class CrmLeadService {
    repository;
    messageBus;
    tenantContext;
    constructor(repository, messageBus, tenantContext) {
        this.repository = repository;
        this.messageBus = messageBus;
        this.tenantContext = tenantContext;
    }
    async createLead(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const lead = await this.repository.create({ ...data, organizationId: tenantId });
        this.messageBus.publish(CrmEventType.LEAD_CREATED, new CrmEvent(CrmEventType.LEAD_CREATED, { lead }), { tenantId });
        return lead;
    }
    async updateLead(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const lead = await this.repository.update(id, tenantId, data);
        this.messageBus.publish(CrmEventType.LEAD_UPDATED, new CrmEvent(CrmEventType.LEAD_UPDATED, { lead }), { tenantId });
        if (data.status === 'qualified') {
            this.messageBus.publish(CrmEventType.LEAD_QUALIFIED, new CrmEvent(CrmEventType.LEAD_QUALIFIED, { leadId: id }), { tenantId });
        }
        else if (data.status === 'disqualified') {
            this.messageBus.publish(CrmEventType.LEAD_DISQUALIFIED, new CrmEvent(CrmEventType.LEAD_DISQUALIFIED, { leadId: id }), { tenantId });
        }
        return lead;
    }
    async deleteLead(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        const lead = await this.repository.delete(id, tenantId);
        this.messageBus.publish(CrmEventType.LEAD_DELETED, new CrmEvent(CrmEventType.LEAD_DELETED, { leadId: id }), { tenantId });
        return lead;
    }
    async getLead(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.findById(id, tenantId);
    }
    async listLeads(organizationId) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        return this.repository.findAll(tenantId);
    }
};
CrmLeadService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CrmLeadRepository,
        MessageBus,
        TenantContextService])
], CrmLeadService);
export { CrmLeadService };
