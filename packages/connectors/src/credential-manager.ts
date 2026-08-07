import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class CredentialManager {
  private readonly logger = new Logger(CredentialManager.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-secret-key', 'salt', 32);
  private readonly iv = crypto.randomBytes(16);

  constructor(private prisma: PrismaClient) {}

  async getCredentials(organizationId: string, provider: string) {
    this.logger.debug(`Fetching credentials for org ${organizationId}, provider ${provider}`);
    const record = await this.prisma.integrationCredential.findUnique({
      where: {
        provider_organizationId: {
          provider,
          organizationId,
        },
      },
    });

    if (!record) return null;

    return {
      ...record,
      apiKey: record.apiKey ? this.decrypt(record.apiKey) : null,
      accessToken: record.accessToken ? this.decrypt(record.accessToken) : null,
      refreshToken: record.refreshToken ? this.decrypt(record.refreshToken) : null,
    };
  }

  async saveCredentials(organizationId: string, provider: string, data: any) {
    this.logger.log(`Saving credentials for org ${organizationId}, provider ${provider}`);
    
    const encryptedData = {
      ...data,
      apiKey: data.apiKey ? this.encrypt(data.apiKey) : null,
      accessToken: data.accessToken ? this.encrypt(data.accessToken) : null,
      refreshToken: data.refreshToken ? this.encrypt(data.refreshToken) : null,
    };

    return this.prisma.integrationCredential.upsert({
      where: {
        provider_organizationId: {
          provider,
          organizationId,
        },
      },
      update: {
        ...encryptedData,
        updatedAt: new Date(),
      },
      create: {
        ...encryptedData,
        organizationId,
        provider,
      },
    });
  }

  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${this.iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(text: string): string {
    const [ivHex, encryptedText] = text.split(':');
    if (!ivHex || !encryptedText) return text; // Not encrypted or wrong format
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
