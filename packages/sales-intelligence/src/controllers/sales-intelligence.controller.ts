import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { SalesIntelligenceService } from '../services/sales-intelligence.service.js';

@Controller('sales-intelligence')
export class SalesIntelligenceController {
  constructor(private readonly service: SalesIntelligenceService) {}

  @Get('leads/:id')
  getLeadAnalysis(@Param('id') id: string) {
    return this.service.analyzeLead(id);
  }

  @Post('analyze/lead/:id')
  analyzeLead(@Param('id') id: string) {
    return this.service.analyzeLead(id);
  }

  @Get('opportunities/:id')
  getOpportunityAnalysis(@Param('id') id: string) {
    return this.service.analyzeOpportunity(id);
  }

  @Post('analyze/opportunity/:id')
  analyzeOpportunity(@Param('id') id: string) {
    return this.service.analyzeOpportunity(id);
  }

  @Get('accounts/:id')
  getAccount360(@Param('id') id: string) {
    return this.service.getAccount360(id);
  }

  @Get('pipeline')
  getPipelineIntelligence(@Query('organizationId') orgId: string) {
    return this.service.getPipelineIntelligence(orgId);
  }

  @Get('forecast')
  getForecast(@Query('organizationId') orgId: string) {
    return this.service.getForecast(orgId);
  }

  @Get('executive')
  getExecutiveIntelligence(@Query('organizationId') orgId: string) {
    return this.service.getExecutiveIntelligence(orgId);
  }

  @Post('missions')
  createMission(@Body() body: { goal: string, priority?: 'low' | 'normal' | 'high' | 'critical', organizationId?: string }) {
    return this.service.requestMission(body.goal, body.priority, body.organizationId);
  }
}
