import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
  }

  async getUserSettings(userId: string) {
    return this.prisma.setting.findMany({
      where: {
        userId,
        organizationId: this.organizationId,
      },
    });
  }

  async updateUserSetting(userId: string, key: string, value: any) {
    const orgId = this.organizationId;
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
