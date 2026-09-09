import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import * as crypto from "crypto";

const KEY_PREFIX = "pk_";
const RANDOM_BYTES = 32;
const PREFIX_LENGTH = 16;

export interface PlatformApiKeyResult {
  id: string;
  name: string;
  organizationId: string;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
  apiKey: string;
}

@Injectable()
export class PlatformApiKeyService {
  private readonly logger = new Logger(PlatformApiKeyService.name);

  constructor(private prisma: PrismaService) {}

  generateRawKey(): string {
    const random = crypto.randomBytes(RANDOM_BYTES).toString("base64url");
    return `${KEY_PREFIX}${random}`;
  }

  hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  derivePrefix(key: string): string {
    return key.slice(0, PREFIX_LENGTH);
  }

  async createKey(
    organizationId: string,
    name: string,
    opts?: { expiresAt?: Date },
  ): Promise<PlatformApiKeyResult> {
    const apiKey = this.generateRawKey();
    const keyHash = this.hashKey(apiKey);
    const keyPrefix = this.derivePrefix(apiKey);

    const record = await this.prisma.platformApiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        organizationId,
        status: "active",
        expiresAt: opts?.expiresAt ?? null,
      },
    });

    return {
      id: record.id,
      name: record.name,
      organizationId: record.organizationId,
      status: record.status,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      apiKey,
    };
  }

  async findKeyRecord(apiKey: string): Promise<any> {
    const keyPrefix = this.derivePrefix(apiKey);
    const candidates = await this.prisma.platformApiKey.findMany({
      where: { keyPrefix },
    });
    const keyHash = this.hashKey(apiKey);
    return candidates.find((c) => c.keyHash === keyHash) ?? null;
  }

  async revokeKey(id: string): Promise<void> {
    const updated = await this.prisma.platformApiKey.update({
      where: { id },
      data: { status: "revoked" },
    });
    if (!updated) {
      throw new NotFoundException("API key not found");
    }
  }

  async recordUsage(id: string): Promise<void> {
    await this.prisma.platformApiKey
      .update({ where: { id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }

  async listKeys(organizationId: string): Promise<any[]> {
    return this.prisma.platformApiKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        keyPrefix: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
