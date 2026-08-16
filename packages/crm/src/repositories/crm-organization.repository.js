var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
let CrmOrganizationRepository = class CrmOrganizationRepository {
    prisma = new PrismaClient();
    async create(data) {
        return this.prisma.crmOrganization.create({
            data,
        });
    }
    async update(id, organizationId, data) {
        const record = await this.prisma.crmOrganization.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmOrganization.update({
            where: { id },
            data,
        });
    }
    async delete(id, organizationId) {
        const record = await this.prisma.crmOrganization.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmOrganization.delete({
            where: { id },
        });
    }
    async findById(id, organizationId) {
        return this.prisma.crmOrganization.findFirst({
            where: { id, organizationId },
            include: {
                contacts: true,
                opportunities: true,
                leads: true,
            },
        });
    }
    async findAll(organizationId) {
        return this.prisma.crmOrganization.findMany({
            where: { organizationId },
            include: {
                contacts: {
                    include: {
                        activities: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });
    }
    async search(organizationId, query) {
        return this.prisma.crmOrganization.findMany({
            where: {
                organizationId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { industry: { contains: query, mode: 'insensitive' } },
                ],
            },
        });
    }
};
CrmOrganizationRepository = __decorate([
    Injectable()
], CrmOrganizationRepository);
export { CrmOrganizationRepository };
