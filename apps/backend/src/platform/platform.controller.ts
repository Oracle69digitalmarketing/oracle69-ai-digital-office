import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import type { 
  ProvisioningRequest, 
  ProvisioningResult, 
  MemoryQueryRequest, 
  MemoryQueryResponse 
} from '@oracle69/platform-contracts';
import { PlatformAuthGuard } from './platform-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('v1/platform')
@UseGuards(PlatformAuthGuard)
export class PlatformController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('provision')
  async provision(@Body() request: ProvisioningRequest): Promise<ProvisioningResult> {
    const org = await this.prisma.organization.create({
      data: {
        id: request.organizationId,
        name: request.name,
        industry: request.industry,
        country: request.country,
        timezone: request.timezone,
      },
    });

    return {
      organizationId: org.id,
      status: 'success',
      apiKey: 'pk_' + Math.random().toString(36).substring(7),
      receptionistAgentId: 'receptionist-001',
    };
  }

  @Post('events/subscribe')
  async subscribe(@Body() body: any): Promise<any> {
    return { status: 'subscribed' };
  }

  @Post('memory/query')
  async queryMemory(@Body() request: MemoryQueryRequest): Promise<MemoryQueryResponse> {
    const results = await this.prisma.longTermMemoryRecord.findMany({
      where: {
        organizationId: request.organizationId,
        content: {
          contains: request.query,
        },
      },
      take: request.limit || 10,
    });

    return {
      results: results.map((r) => ({
        id: r.id,
        content: r.content,
        metadata: (r.metadata as any) || {},
        timestamp: r.timestamp,
      })),
    };
  }
}
