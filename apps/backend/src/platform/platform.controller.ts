import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
  NotFoundException,
} from "@nestjs/common";
import type { ProvisioningResult, MemoryQueryResponse } from "@oracle69/platform-contracts";
import { PlatformAuthGuard } from "./platform-auth.guard.js";
import { PlatformApiKeyService } from "./platform-api-key.service.js";
import { Public } from "../auth/public.decorator.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateApiKeyDto, ProvisionOrgDto, MemoryQueryDto } from "./dto/platform.dto.js";

@Public()
@Controller("v1/platform")
@UseGuards(PlatformAuthGuard)
export class PlatformController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeyService: PlatformApiKeyService,
  ) {}

  @Post("provision")
  async provision(@Body() request: ProvisionOrgDto): Promise<ProvisioningResult> {
    const org = await this.prisma.organization.create({
      data: {
        name: request.name || "Default Organization",
        industry: request.industry,
        country: request.country,
        timezone: request.timezone,
      },
    });

    const apiKeyResult = await this.apiKeyService.createKey(org.id, "provisioned");

    return {
      organizationId: org.id,
      status: "success",
      apiKey: apiKeyResult.apiKey,
      receptionistAgentId: "receptionist-001",
    };
  }

  @Post("events/subscribe")
  async subscribe(): Promise<any> {
    return { status: "subscribed" };
  }

  @Post("memory/query")
  async queryMemory(
    @Req() req: any,
    @Body() request: MemoryQueryDto,
  ): Promise<MemoryQueryResponse> {
    const tenantContext = req.tenantContext;
    const organizationId = tenantContext?.organizationId;
    if (!organizationId) {
      throw new NotFoundException("Organization not resolved");
    }
    const results = await this.prisma.longTermMemoryRecord.findMany({
      where: {
        organizationId,
        content: {
          contains: request.query || "",
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

  @Get("keys")
  async listKeys(@Req() req: any) {
    const organizationId = req.tenantContext?.organizationId;
    if (!organizationId) {
      throw new NotFoundException("Organization not resolved");
    }
    return this.apiKeyService.listKeys(organizationId);
  }

  @Post("keys")
  async createKey(@Req() req: any, @Body() body: CreateApiKeyDto) {
    const organizationId = req.tenantContext?.organizationId;
    if (!organizationId) {
      throw new NotFoundException("Organization not resolved");
    }
    return this.apiKeyService.createKey(organizationId, body?.name || "api-key", {
      expiresAt: body?.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Delete("keys/:id")
  async revokeKey(@Req() req: any, @Param("id") id: string) {
    const organizationId = req.tenantContext?.organizationId;
    if (!organizationId) {
      throw new NotFoundException("Organization not resolved");
    }
    const record = await this.prisma.platformApiKey.findFirst({
      where: { id, organizationId },
    });
    if (!record) {
      throw new NotFoundException("API key not found");
    }
    await this.apiKeyService.revokeKey(id);
    return { status: "revoked" };
  }
}
