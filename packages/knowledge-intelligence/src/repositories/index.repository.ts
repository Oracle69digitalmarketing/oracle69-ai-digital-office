import { Inject, Injectable, Optional } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { KnowledgeIndexEntry } from "../types.js";

export const KNOWLEDGE_INDEX_REPOSITORY = "KNOWLEDGE_INDEX_REPOSITORY";

export interface IndexEntryInput {
  articleId: string;
  token: string;
  weight: number;
  organizationId: string;
}

export interface IndexRepository {
  replaceForArticle(
    articleId: string,
    organizationId: string,
    entries: IndexEntryInput[],
  ): Promise<void>;
  findByTokens(organizationId: string, tokens: string[]): Promise<KnowledgeIndexEntry[]>;
  findByOrganization(organizationId: string): Promise<KnowledgeIndexEntry[]>;
  countByArticle(organizationId: string): Promise<Map<string, number>>;
}

@Injectable()
export class PrismaIndexRepository implements IndexRepository {
  constructor(@Optional() @Inject("PrismaService") private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error("PrismaService is not available");
    }
    return this.prisma;
  }

  async replaceForArticle(
    articleId: string,
    organizationId: string,
    entries: IndexEntryInput[],
  ): Promise<void> {
    await this.db.$transaction([
      this.db.knowledgeIndexEntry.deleteMany({ where: { articleId } }),
      ...entries.map((entry) =>
        this.db.knowledgeIndexEntry.create({
          data: {
            articleId: entry.articleId,
            token: entry.token,
            weight: entry.weight,
            organizationId,
          },
        }),
      ),
    ]);
  }

  async findByTokens(organizationId: string, tokens: string[]): Promise<KnowledgeIndexEntry[]> {
    const rows = await this.db.knowledgeIndexEntry.findMany({
      where: {
        organizationId,
        token: { in: tokens },
      },
    });
    return rows.map((row) => this.fromRow(row));
  }

  async findByOrganization(organizationId: string): Promise<KnowledgeIndexEntry[]> {
    const rows = await this.db.knowledgeIndexEntry.findMany({
      where: { organizationId },
    });
    return rows.map((row) => this.fromRow(row));
  }

  async countByArticle(organizationId: string): Promise<Map<string, number>> {
    const rows = await this.db.knowledgeIndexEntry.findMany({
      where: { organizationId },
      select: { articleId: true },
    });
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.articleId, (counts.get(row.articleId) ?? 0) + 1);
    }
    return counts;
  }

  private fromRow(row: any): KnowledgeIndexEntry {
    return {
      id: row.id,
      articleId: row.articleId,
      token: row.token,
      weight: row.weight,
      organizationId: row.organizationId,
    };
  }
}

@Injectable()
export class InMemoryIndexRepository implements IndexRepository {
  private entries = new Map<string, KnowledgeIndexEntry>();
  private seq = 0;

  async replaceForArticle(
    articleId: string,
    organizationId: string,
    entries: IndexEntryInput[],
  ): Promise<void> {
    for (const [key, entry] of Array.from(this.entries.entries())) {
      if (entry.articleId === articleId) {
        this.entries.delete(key);
      }
    }
    for (const input of entries) {
      this.entries.set(`${articleId}:${input.token}:${this.seq++}`, {
        id: `idx-${this.seq}`,
        articleId: input.articleId,
        token: input.token,
        weight: input.weight,
        organizationId,
      });
    }
  }

  async findByTokens(organizationId: string, tokens: string[]): Promise<KnowledgeIndexEntry[]> {
    const set = new Set(tokens);
    return Array.from(this.entries.values()).filter(
      (e) => e.organizationId === organizationId && set.has(e.token),
    );
  }

  async findByOrganization(organizationId: string): Promise<KnowledgeIndexEntry[]> {
    return Array.from(this.entries.values()).filter((e) => e.organizationId === organizationId);
  }

  async countByArticle(organizationId: string): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    for (const entry of this.entries.values()) {
      if (entry.organizationId !== organizationId) continue;
      counts.set(entry.articleId, (counts.get(entry.articleId) ?? 0) + 1);
    }
    return counts;
  }
}
