import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCrmOpportunityDto, UpdateCrmOpportunityDto, CreateCrmPipelineDto, UpdateCrmPipelineDto, CreateCrmPipelineStageDto, UpdateCrmPipelineStageDto } from '../dto/crm.dto.js';

@Injectable()
export class CrmOpportunityRepository {
  private prisma = new PrismaClient();

  // Opportunity CRUD
  async createOpportunity(data: CreateCrmOpportunityDto) {
    return this.prisma.crmOpportunity.create({
      data,
    });
  }

  async updateOpportunity(id: string, data: UpdateCrmOpportunityDto) {
    return this.prisma.crmOpportunity.update({
      where: { id },
      data,
    });
  }

  async deleteOpportunity(id: string) {
    return this.prisma.crmOpportunity.delete({
      where: { id },
    });
  }

  async findOpportunityById(id: string) {
    return this.prisma.crmOpportunity.findUnique({
      where: { id },
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
  async createPipeline(data: CreateCrmPipelineDto) {
    return this.prisma.crmPipeline.create({
      data,
    });
  }

  async updatePipeline(id: string, data: UpdateCrmPipelineDto) {
    return this.prisma.crmPipeline.update({
      where: { id },
      data,
    });
  }

  async deletePipeline(id: string) {
    return this.prisma.crmPipeline.delete({
      where: { id },
    });
  }

  async findPipelineById(id: string) {
    return this.prisma.crmPipeline.findUnique({
      where: { id },
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
  async createPipelineStage(data: CreateCrmPipelineStageDto) {
    return this.prisma.crmPipelineStage.create({
      data,
    });
  }

  async updatePipelineStage(id: string, data: UpdateCrmPipelineStageDto) {
    return this.prisma.crmPipelineStage.update({
      where: { id },
      data,
    });
  }

  async deletePipelineStage(id: string) {
    return this.prisma.crmPipelineStage.delete({
      where: { id },
    });
  }
}
