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
import { CrmActivityRepository } from '../repositories/crm-activity.repository.js';
import { CrmEventType, CrmEvent } from '../events/crm.events.js';
let CrmActivityService = class CrmActivityService {
    repository;
    messageBus;
    tenantContext;
    constructor(repository, messageBus, tenantContext) {
        this.repository = repository;
        this.messageBus = messageBus;
        this.tenantContext = tenantContext;
    }
    // Activity Methods
    async createActivity(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const activity = await this.repository.createActivity({ ...data, organizationId: tenantId });
        this.messageBus.publish(CrmEventType.ACTIVITY_CREATED, new CrmEvent(CrmEventType.ACTIVITY_CREATED, { activity }), { tenantId });
        return activity;
    }
    async updateActivity(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        const activity = await this.repository.updateActivity(id, tenantId, data);
        if (data.status === 'completed') {
            this.messageBus.publish(CrmEventType.ACTIVITY_COMPLETED, new CrmEvent(CrmEventType.ACTIVITY_COMPLETED, { activityId: id }), { tenantId });
        }
        else if (data.status === 'cancelled') {
            this.messageBus.publish(CrmEventType.ACTIVITY_CANCELLED, new CrmEvent(CrmEventType.ACTIVITY_CANCELLED, { activityId: id }), { tenantId });
        }
        return activity;
    }
    async deleteActivity(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.deleteActivity(id, tenantId);
    }
    async getActivity(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.findActivityById(id, tenantId);
    }
    async listActivities(organizationId) {
        const tenantId = this.tenantContext.resolveTenantId(organizationId);
        return this.repository.findActivitiesByOrganization(tenantId);
    }
    // Note Methods
    async createNote(data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        return this.repository.createNote({ ...data, organizationId: tenantId });
    }
    async updateNote(id, data) {
        const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
        return this.repository.updateNote(id, tenantId, data);
    }
    async deleteNote(id) {
        const tenantId = this.tenantContext.resolveTenantId();
        return this.repository.deleteNote(id, tenantId);
    }
};
CrmActivityService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CrmActivityRepository,
        MessageBus,
        TenantContextService])
], CrmActivityService);
export { CrmActivityService };
