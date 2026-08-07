import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CredentialManager {
  private readonly logger = new Logger(CredentialManager.name);

  constructor(private prisma: PrismaClient) {}

  async getCredentials(organizationId: string, provider: string) {
    this.logger.debug(`Fetching credentials for org ${organizationId}, provider ${provider}`);
    return this.prisma.integrationCredential.findUnique({
      where: {
        provider_organizationId: {
          provider,
          organizationId,
        },
      },
    });
  }

  async saveCredentials(organizationId: string, provider: string, data: any) {
    this.logger.log(`Saving credentials for org ${organizationId}, provider ${provider}`);
    return this.prisma.integrationCredential.upsert({
      where: {
        provider_organizationId: {
          provider,
          organizationId,
        },
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        ...data,
        organizationId,
        provider,
      },
    });
  }
}
