import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { TenantContext } from "@oracle69/platform-contracts";
import { PlatformApiKeyService } from "./platform-api-key.service.js";

const KEY_PREFIX = "pk_";

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(private apiKeyService: PlatformApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"];

    if (typeof apiKey !== "string" || apiKey.length === 0) {
      throw new UnauthorizedException("Missing platform API key");
    }

    if (!apiKey.startsWith(KEY_PREFIX)) {
      throw new UnauthorizedException("Invalid platform API key");
    }

    const record = await this.apiKeyService.findKeyRecord(apiKey);
    if (!record) {
      throw new UnauthorizedException("Invalid platform API key");
    }

    if (record.status !== "active") {
      throw new UnauthorizedException("Platform API key is not active");
    }

    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      throw new UnauthorizedException("Platform API key has expired");
    }

    this.apiKeyService.recordUsage(record.id).catch(() => undefined);

    const tenantContext: TenantContext = {
      organizationId: record.organizationId,
      productIdentifier: "business-architect",
    };

    (request as any).tenantContext = tenantContext;
    (request as any).platformApiKey = {
      id: record.id,
      name: record.name,
      organizationId: record.organizationId,
    };

    return true;
  }
}
