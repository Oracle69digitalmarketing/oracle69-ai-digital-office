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
import { CrmOrganizationRepository } from '../repositories/crm-organization.repository.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';
let CrmOrganizationService = class CrmOrganizationService {
    repository;
    messageBus;
    tenantContext;
    constructor(repository, messageBus, tenantContext) {
        this.repository = repository;
        this.messageBus = messageBus;
        this.tenantContext = tenantContext;
    }
    async createOrganization(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const organization = await this.repository.create({ ...data, organizationId: tenantId });
        this.messageBus.publish(CrmEventType.ORGANIZATION_CREATED, new CrmEvent(CrmEventType.ORGANIZATION_CREATED, { organization }), { tenantId });
        return organization;
    }
    async updateOrganization(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(id);
        const organization = await this.repository.update(id, tenantId, data);
        this.messageBus.publish(CrmEventType.ORGANIZATION_UPDATED, new CrmEvent(CrmEventType.ORGANIZATION_UPDATED, { organization }), { tenantId });
        return organization;
    }
    async deleteOrganization(id) {
        const tenantId = this.tenantContext.resolveTenantId(id);
        const organization = await this.repository.delete(id, tenantId);
        this.messageBus.publish(CrmEventType.ORGANIZATION_DELETED, new CrmEvent(CrmEventType.ORGANIZATION_DELETED, { organizationId: id }), { tenantId });
        return organization;
    }
    async getOrganization(id) {
        const tenantId = this.tenantContext.resolveTenantId(id);
        return this.repository.findById(id, tenantId);
    }
    async listOrganizations(organizationId) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        const orgs = await this.repository.findAll(tenantId);
        return orgs.map((org) => {
            // Find contact with latest createdAt
            const contacts = org.contacts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const primaryContact = contacts[0];
            // Find latest activity across all contacts
            let latestActivityDate = null;
            for (const contact of org.contacts) {
                if (contact.activities.length > 0) {
                    const activityDate = new Date(contact.activities[0].createdAt);
                    if (!latestActivityDate || activityDate > latestActivityDate) {
                        latestActivityDate = activityDate;
                    }
                }
            }
            return {
                id: org.id,
                name: org.name,
                industry: org.industry,
                status: org.status,
                contactPerson: primaryContact
                    ? `${primaryContact.firstName} ${primaryContact.lastName}`
                    : 'N/A',
                email: primaryContact?.email ?? 'N/A',
                lastActivity: latestActivityDate
                    ? this.formatDate(latestActivityDate)
                    : 'No activity',
            };
        });
    }
    formatDate(date) {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays > 0)
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        if (diffInHours > 0)
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
    async searchOrganizations(organizationId, query) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        return this.repository.search(tenantId, query);
    }
};
CrmOrganizationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CrmOrganizationRepository,
        MessageBus,
        TenantContextService])
], CrmOrganizationService);
export { CrmOrganizationService };
