import { Injectable, Logger } from "@nestjs/common";
import { VectorMemoryAdapter } from "./memory-manager.js";

@Injectable()
export class PgVectorAdapter implements VectorMemoryAdapter {
  private readonly logger = new Logger(PgVectorAdapter.name);

  constructor(
    private readonly prisma: any,
    private readonly embeddingProvider: { embed(text: string): Promise<number[]> },
  ) {}

  async embed(text: string): Promise<number[]> {
    return this.embeddingProvider.embed(text);
  }

  async upsert(id: string, vector: number[], metadata: any): Promise<void> {
    const vectorStr = `[${vector.join(",")}]`;

    // Prisma doesn't support vector types directly, so we use raw SQL
    await this.prisma.$executeRaw`
      UPDATE "LongTermMemoryRecord"
      SET "embedding" = ${vectorStr}::vector
      WHERE "id" = ${id}
    `;
    this.logger.debug(`Updated embedding for record: ${id}`);
  }

  async similaritySearch(vector: number[], limit: number, organizationId?: string): Promise<any[]> {
    if (!organizationId) {
      this.logger.warn("semanticSearch called without organizationId, returning empty results (fail-closed)");
      return [];
    }

    const vectorStr = `[${vector.join(",")}]`;

    const results = await this.prisma.$queryRaw`
      SELECT id, content, metadata, timestamp, (embedding <=> ${vectorStr}::vector) as distance
      FROM "LongTermMemoryRecord"
      WHERE "organizationId" = ${organizationId}
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    return results as any[];
  }
}
