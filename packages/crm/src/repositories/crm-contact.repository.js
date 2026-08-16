var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
let CrmContactRepository = class CrmContactRepository {
    prisma = new PrismaClient();
    async create(data) {
        return this.prisma.crmContact.create({
            data,
        });
    }
    async update(id, organizationId, data) {
        const record = await this.prisma.crmContact.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmContact.update({
            where: { id },
            data,
        });
    }
    async delete(id, organizationId) {
        const record = await this.prisma.crmContact.findFirst({ where: { id, organizationId } });
        if (!record)
            throw new Error('Not found or access denied');
        return this.prisma.crmContact.delete({
            where: { id },
        });
    }
    async findById(id, organizationId) {
        return this.prisma.crmContact.findFirst({
            where: { id, organizationId },
            include: {
                crmOrganization: true,
                owner: true,
                activities: true,
                notes: true,
                opportunities: true,
            },
        });
    }
    async findAll(organizationId) {
        return this.prisma.crmContact.findMany({
            where: { organizationId },
            include: {
                crmOrganization: true,
            },
        });
    }
    async search(organizationId, query) {
        return this.prisma.crmContact.findMany({
            where: {
                organizationId,
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
        });
    }
};
CrmContactRepository = __decorate([
    Injectable()
], CrmContactRepository);
export { CrmContactRepository };
