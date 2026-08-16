var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
let CrmActivityRepository = class CrmActivityRepository {
    prisma = new PrismaClient();
    // Activity CRUD
    async createActivity(data) {
        return this.prisma.crmActivity.create({
            data,
        });
    }
    async updateActivity(id, organizationId, data) {
        const record = await this.prisma.crmActivity.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmActivity.update({
            where: { id },
            data,
        });
    }
    async deleteActivity(id, organizationId) {
        const record = await this.prisma.crmActivity.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmActivity.delete({
            where: { id },
        });
    }
    async findActivityById(id, organizationId) {
        return this.prisma.crmActivity.findFirst({
            where: { id, organizationId },
            include: {
                crmContact: true,
                crmLead: true,
                crmOpportunity: true,
                assignedTo: true,
                notes: true,
            },
        });
    }
    async findActivitiesByOrganization(organizationId) {
        return this.prisma.crmActivity.findMany({
            where: { organizationId },
            include: {
                crmContact: true,
                crmLead: true,
                crmOpportunity: true,
            },
        });
    }
    // Note CRUD
    async createNote(data) {
        // Remove organizationId from data if it's not in the model
        const { organizationId, ...rest } = data;
        return this.prisma.crmNote.create({
            data: rest,
        });
    }
    async updateNote(id, organizationId, data) {
        // Find note where it's linked to an entity in this organization
        const record = await this.prisma.crmNote.findFirst({
            where: {
                id,
                OR: [
                    { crmOrganization: { organizationId } },
                    { crmContact: { organizationId } },
                    { crmLead: { organizationId } },
                    { crmOpportunity: { organizationId } },
                    { crmActivity: { organization: { id: organizationId } } }
                ]
            }
        });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmNote.update({
            where: { id },
            data,
        });
    }
    async deleteNote(id, organizationId) {
        const record = await this.prisma.crmNote.findFirst({
            where: {
                id,
                OR: [
                    { crmOrganization: { organizationId } },
                    { crmContact: { organizationId } },
                    { crmLead: { organizationId } },
                    { crmOpportunity: { organizationId } },
                    { crmActivity: { organization: { id: organizationId } } }
                ]
            }
        });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmNote.delete({
            where: { id },
        });
    }
};
CrmActivityRepository = __decorate([
    Injectable()
], CrmActivityRepository);
export { CrmActivityRepository };
