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
import { CrmContactRepository } from '../repositories/crm-contact.repository.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';
let CrmContactService = class CrmContactService {
    repository;
    messageBus;
    tenantContext;
    constructor(repository, messageBus, tenantContext) {
        this.repository = repository;
        this.messageBus = messageBus;
        this.tenantContext = tenantContext;
    }
    async createContact(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const contact = await this.repository.create({ ...data, organizationId: tenantId });
        this.messageBus.publish(CrmEventType.CONTACT_CREATED, new CrmEvent(CrmEventType.CONTACT_CREATED, { contact }), { tenantId });
        return contact;
    }
    async updateContact(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const contact = await this.repository.update(id, tenantId, data);
        this.messageBus.publish(CrmEventType.CONTACT_UPDATED, new CrmEvent(CrmEventType.CONTACT_UPDATED, { contact }), { tenantId });
        return contact;
    }
    async deleteContact(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        const contact = await this.repository.delete(id, tenantId);
        this.messageBus.publish(CrmEventType.CONTACT_DELETED, new CrmEvent(CrmEventType.CONTACT_DELETED, { contactId: id }), { tenantId });
        return contact;
    }
    async getContact(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.findById(id, tenantId);
    }
    async listContacts(organizationId) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        return this.repository.findAll(tenantId);
    }
    async searchContacts(query, organizationId) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        return this.repository.search(tenantId, query);
    }
};
CrmContactService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CrmContactRepository,
        MessageBus,
        TenantContextService])
], CrmContactService);
export { CrmContactService };
