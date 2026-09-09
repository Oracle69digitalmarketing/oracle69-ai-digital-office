import { Injectable, Logger, BadRequestException, Optional } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import { TenantContextService } from "@oracle69/runtime";

const VERSION = 1;
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const KEY_DERIVATION = "scrypt";

interface EncryptedBlob {
  version: number;
  algo: string;
  kdf: string;
  salt: string;
  iv: string;
  tag: string;
  data: string;
}

@Injectable()
export class CredentialManager {
  private readonly logger = new Logger(CredentialManager.name);
  private readonly key: Buffer;
  private readonly salt: Buffer;

  constructor(
    private prisma: PrismaClient,
    @Optional() private tenantContext?: TenantContextService,
  ) {
    const rawKey = process.env.ENCRYPTION_KEY;
    if (!rawKey || rawKey.length === 0) {
      throw new Error(
        "ENCRYPTION_KEY is required. Set a strong ENCRYPTION_KEY environment variable before starting the application.",
      );
    }
    if (rawKey === "default-secret-key" || rawKey === "your-encryption-key") {
      throw new Error("ENCRYPTION_KEY must not use a placeholder or default value.");
    }
    this.salt = crypto.randomBytes(16);
    this.key = crypto.scryptSync(rawKey, this.salt, KEY_LENGTH);
  }

  /**
   * Enforces tenant authority for every tenant-owned credential operation.
   *
   * The active tenant (via {@link TenantContextService}) is authoritative. When
   * a tenant context is active, a caller-supplied `organizationId` MUST match it
   * exactly; otherwise the operation is rejected so a caller can never retrieve,
   * refresh, mutate, or delete another tenant's credential by supplying a
   * different `organizationId`. When no tenant context is active, tenant-owned
   * credential operations fail closed (no `system` fallback).
   *
   * This is defensive: `ConnectorManager` already resolves the authoritative
   * tenant and never forwards a client-supplied `organizationId`. This guard
   * closes the boundary for any caller that invokes this service directly.
   *
   * When no `TenantContextService` is injected (e.g. unit tests that only
   * exercise encryption primitives), enforcement is skipped so the service
   * remains usable for non-tenant credential behavior.
   */
  private assertTenantAuthority(organizationId: string): void {
    if (!this.tenantContext) return;
    if (!this.tenantContext.isTenantScopeActive()) {
      throw new BadRequestException(
        "A tenant context is required for credential operations",
      );
    }
    const activeTenant = this.tenantContext.getTenantId();
    if (!activeTenant || activeTenant !== organizationId) {
      this.logger.warn(
        `Credential operation for org ${organizationId} rejected outside active tenant context`,
      );
      throw new BadRequestException(
        "Credential operation is not permitted in the current tenant context",
      );
    }
  }

  async getCredentials(organizationId: string, provider: string) {
    this.assertTenantAuthority(organizationId);
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
    this.assertTenantAuthority(organizationId);
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
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, { authTagLength: 16 });
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    const blob: EncryptedBlob = {
      version: VERSION,
      algo: ALGORITHM,
      kdf: KEY_DERIVATION,
      salt: this.salt.toString("hex"),
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      data: encrypted.toString("hex"),
    };

    return JSON.stringify(blob);
  }

  private decrypt(text: string): string {
    let blob: EncryptedBlob;
    try {
      blob = JSON.parse(text) as EncryptedBlob;
    } catch {
      throw new BadRequestException("Credential is not in a valid encrypted format");
    }

    if (
      typeof blob.version !== "number" ||
      blob.algo !== ALGORITHM ||
      !blob.iv ||
      !blob.tag ||
      !blob.data
    ) {
      throw new BadRequestException("Credential is not in a supported encrypted format");
    }

    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY as string, Buffer.from(blob.salt, "hex"), KEY_LENGTH);
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(blob.iv, "hex"),
      { authTagLength: 16 },
    );
    decipher.setAuthTag(Buffer.from(blob.tag, "hex"));

    try {
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(blob.data, "hex")),
        decipher.final(),
      ]);
      return decrypted.toString("utf8");
    } catch {
      throw new BadRequestException("Credential authentication failed. The data may be tampered with.");
    }
  }
}
