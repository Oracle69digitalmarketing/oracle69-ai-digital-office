import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  async getUserSettings(userId: string) {
    const orgId = this.tenantContext.getTenantId();
    if (!orgId) throw new NotFoundException("Tenant not found");
    return this.prisma.setting.findMany({
      where: {
        userId,
        organizationId: orgId,
      },
    });
  }

  async updateUserSetting(userId: string, key: string, value: any) {
    const orgId = this.tenantContext.getTenantId();
    if (!orgId) throw new NotFoundException("Tenant not found");
    return this.prisma.setting.upsert({
      where: {
        key_userId_organizationId: {
          key,
          userId,
          organizationId: orgId,
        },
      },
      update: { value },
      create: {
        key,
        value,
        userId,
        organizationId: orgId,
      },
    });
  }
}
