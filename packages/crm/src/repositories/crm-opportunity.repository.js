var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
let CrmOpportunityRepository = class CrmOpportunityRepository {
    prisma = new PrismaClient();
    // Opportunity CRUD
    async createOpportunity(data) {
        return this.prisma.crmOpportunity.create({
            data,
        });
    }
    async updateOpportunity(id, organizationId, data) {
        const record = await this.prisma.crmOpportunity.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmOpportunity.update({
            where: { id },
            data,
        });
    }
    async deleteOpportunity(id, organizationId) {
        const record = await this.prisma.crmOpportunity.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmOpportunity.delete({
            where: { id },
        });
    }
    async findOpportunityById(id, organizationId) {
        return this.prisma.crmOpportunity.findFirst({
            where: { id, organizationId },
            include: {
                crmOrganization: true,
                owner: true,
                pipeline: true,
                contacts: true,
                activities: true,
                notes: true,
            },
        });
    }
    async findOpportunitiesByOrganization(organizationId) {
        return this.prisma.crmOpportunity.findMany({
            where: { organizationId },
            include: {
                crmOrganization: true,
                pipeline: true,
            },
        });
    }
    // Pipeline CRUD
    async createPipeline(data) {
        return this.prisma.crmPipeline.create({
            data,
        });
    }
    async updatePipeline(id, organizationId, data) {
        const record = await this.prisma.crmPipeline.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmPipeline.update({
            where: { id },
            data,
        });
    }
    async deletePipeline(id, organizationId) {
        const record = await this.prisma.crmPipeline.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmPipeline.delete({
            where: { id },
        });
    }
    async findPipelineById(id, organizationId) {
        return this.prisma.crmPipeline.findFirst({
            where: { id, organizationId },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
                opportunities: true,
            },
        });
    }
    async findAllPipelines(organizationId) {
        return this.prisma.crmPipeline.findMany({
            where: { organizationId },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }
    // Pipeline Stage CRUD
    async createPipelineStage(data) {
        // Remove organizationId from data if it's not in the model
        const { organizationId, ...rest } = data;
        return this.prisma.crmPipelineStage.create({
            data: rest,
        });
    }
    async updatePipelineStage(id, organizationId, data) {
        const record = await this.prisma.crmPipelineStage.findFirst({
            where: {
                id,
                pipeline: { organizationId }
            }
        });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmPipelineStage.update({
            where: { id },
            data,
        });
    }
    async deletePipelineStage(id, organizationId) {
        const record = await this.prisma.crmPipelineStage.findFirst({
            where: {
                id,
                pipeline: { organizationId }
            }
        });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmPipelineStage.delete({
            where: { id },
        });
    }
};
CrmOpportunityRepository = __decorate([
    Injectable()
], CrmOpportunityRepository);
export { CrmOpportunityRepository };
