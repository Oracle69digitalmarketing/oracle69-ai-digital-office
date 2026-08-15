import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCrmOpportunityDto, UpdateCrmOpportunityDto, CreateCrmPipelineDto, UpdateCrmPipelineDto, CreateCrmPipelineStageDto, UpdateCrmPipelineStageDto } from '../dto/crm.dto.js';

@Injectable()
export class CrmOpportunityRepository {
  private prisma = new PrismaClient();

  // Opportunity CRUD
  async createOpportunity(data: CreateCrmOpportunityDto & { organizationId: string }) {
    return this.prisma.crmOpportunity.create({
      data,
    });
  }

  async updateOpportunity(id: string, organizationId: string, data: UpdateCrmOpportunityDto) {
    const record = await this.prisma.crmOpportunity.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmOpportunity.update({
      where: { id },
      data,
    });
  }

  async deleteOpportunity(id: string, organizationId: string) {
    const record = await this.prisma.crmOpportunity.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmOpportunity.delete({
      where: { id },
    });
  }

  async findOpportunityById(id: string, organizationId: string) {
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

  async findOpportunitiesByOrganization(organizationId: string) {
    return this.prisma.crmOpportunity.findMany({
      where: { organizationId },
      include: {
        crmOrganization: true,
        pipeline: true,
      },
    });
  }

  // Pipeline CRUD
  async createPipeline(data: CreateCrmPipelineDto & { organizationId: string }) {
    return this.prisma.crmPipeline.create({
      data,
    });
  }

  async updatePipeline(id: string, organizationId: string, data: UpdateCrmPipelineDto) {
    const record = await this.prisma.crmPipeline.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmPipeline.update({
      where: { id },
      data,
    });
  }

  async deletePipeline(id: string, organizationId: string) {
    const record = await this.prisma.crmPipeline.findFirst({ where: { id, organizationId } });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmPipeline.delete({
      where: { id },
    });
  }

  async findPipelineById(id: string, organizationId: string) {
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

  async findAllPipelines(organizationId: string) {
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
  async createPipelineStage(data: CreateCrmPipelineStageDto & { organizationId: string }) {
    // Remove organizationId from data if it's not in the model
    const { organizationId, ...rest } = data;
    return this.prisma.crmPipelineStage.create({
      data: rest,
    });
  }

  async updatePipelineStage(id: string, organizationId: string, data: UpdateCrmPipelineStageDto) {
    const record = await this.prisma.crmPipelineStage.findFirst({ 
      where: { 
        id, 
        pipeline: { organizationId } 
      } 
    });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmPipelineStage.update({
      where: { id },
      data,
    });
  }

  async deletePipelineStage(id: string, organizationId: string) {
    const record = await this.prisma.crmPipelineStage.findFirst({ 
      where: { 
        id, 
        pipeline: { organizationId } 
      } 
    });
    if (!record) throw new Error('Not found or access denied');
    return this.prisma.crmPipelineStage.delete({
      where: { id },
    });
  }
}
