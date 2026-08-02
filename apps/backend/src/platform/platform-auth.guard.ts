import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TenantContext } from '@oracle69/platform-contracts';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('Missing platform API key');
    }

    // Mock validation and resolution for AR-005/AR-006
    if (!apiKey.startsWith('pk_')) {
      throw new UnauthorizedException('Invalid platform API key');
    }

    const tenantContext: TenantContext = {
      organizationId: 'org-mock-001',
      productIdentifier: 'business-architect',
    };

    (request as any).tenantContext = tenantContext;

    return true;
  }
}
