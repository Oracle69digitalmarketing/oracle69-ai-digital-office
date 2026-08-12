import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleVersion } from '../types.js';

export const KNOWLEDGE_ARTICLE_REPOSITORY = 'KNOWLEDGE_ARTICLE_REPOSITORY';

export interface ArticleRepository {
  create(article: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeArticle>;
  update(id: string, data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle>;
  findById(id: string, organizationId?: string): Promise<KnowledgeArticle | null>;
  findByOrganization(
    organizationId: string,
    status?: KnowledgeArticleStatus,
    category?: string,
  ): Promise<KnowledgeArticle[]>;
  saveVersion(version: Omit<KnowledgeArticleVersion, 'id' | 'createdAt'>): Promise<KnowledgeArticleVersion>;
  findVersion(articleId: string, version: number, organizationId?: string): Promise<KnowledgeArticleVersion | null>;
  listVersions(articleId: string, organizationId?: string): Promise<KnowledgeArticleVersion[]>;
}

@Injectable()
export class PrismaArticleRepository implements ArticleRepository {
  constructor(@Optional() @Inject('PrismaService') private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error('PrismaService is not available');
    }
    return this.prisma;
  }

  async create(article: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeArticle> {
    const data = {
      ...article,
      ...(article.publishedAt ? { publishedAt: new Date(article.publishedAt) } : {}),
    };
    const created = await this.db.knowledgeArticle.create({ data });
    return this.fromRow({ ...data, ...created });
  }

  async update(id: string, data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const updated = await this.db.knowledgeArticle.update({
      where: { id },
      data: {
        ...(data as any),
        ...(data.publishedAt ? { publishedAt: new Date(data.publishedAt) } : {}),
      },
    });
    return this.fromRow({ ...(data as any), ...updated });
  }

  async findById(id: string, organizationId?: string): Promise<KnowledgeArticle | null> {
    const row = await this.db.knowledgeArticle.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromRow(row);
  }

  async findByOrganization(
    organizationId: string,
    status?: KnowledgeArticleStatus,
    category?: string,
  ): Promise<KnowledgeArticle[]> {
    const rows = await this.db.knowledgeArticle.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.fromRow(row));
  }

  async saveVersion(version: Omit<KnowledgeArticleVersion, 'id' | 'createdAt'>): Promise<KnowledgeArticleVersion> {
    const created = await this.db.knowledgeArticleVersion.create({ data: version });
    return this.fromVersionRow(created);
  }

  async findVersion(
    articleId: string,
    version: number,
    organizationId?: string,
  ): Promise<KnowledgeArticleVersion | null> {
    const row = await this.db.knowledgeArticleVersion.findUnique({
      where: { articleId_version: { articleId, version } },
    });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromVersionRow(row);
  }

  async listVersions(articleId: string, organizationId?: string): Promise<KnowledgeArticleVersion[]> {
    const rows = await this.db.knowledgeArticleVersion.findMany({
      where: { articleId },
      orderBy: { version: 'desc' },
    });
    if (organizationId) {
      return rows.filter((row) => row.organizationId === organizationId).map((row) => this.fromVersionRow(row));
    }
    return rows.map((row) => this.fromVersionRow(row));
  }

  private fromRow(row: any): KnowledgeArticle {
    return {
      ...row,
      ...(row.publishedAt ? { publishedAt: row.publishedAt.toISOString() } : {}),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private fromVersionRow(row: any): KnowledgeArticleVersion {
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

@Injectable()
export class InMemoryArticleRepository implements ArticleRepository {
  private articles = new Map<string, KnowledgeArticle>();
  private versions = new Map<string, KnowledgeArticleVersion>();
  private versionSeq = 0;

  /** Test-only helper to seed a fully-formed article directly. */
  seed(article: KnowledgeArticle): KnowledgeArticle {
    this.articles.set(article.id, article);
    return article;
  }

  async create(article: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeArticle> {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const created: KnowledgeArticle = {
      ...article,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(id, created);
    return created;
  }

  async update(id: string, data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const existing = this.articles.get(id);
    if (!existing) throw new Error('Article not found');
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.articles.set(id, updated);
    return updated;
  }

  async findById(id: string, organizationId?: string): Promise<KnowledgeArticle | null> {
    const a = this.articles.get(id);
    if (!a) return null;
    if (organizationId && a.organizationId !== organizationId) return null;
    return a;
  }

  async findByOrganization(
    organizationId: string,
    status?: KnowledgeArticleStatus,
    category?: string,
  ): Promise<KnowledgeArticle[]> {
    return Array.from(this.articles.values())
      .filter(
        (a) =>
          a.organizationId === organizationId &&
          (!status || a.status === status) &&
          (!category || a.category === category),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async saveVersion(version: Omit<KnowledgeArticleVersion, 'id' | 'createdAt'>): Promise<KnowledgeArticleVersion> {
    const id = `v-${this.versionSeq++}`;
    const created: KnowledgeArticleVersion = {
      ...version,
      id,
      createdAt: new Date().toISOString(),
    };
    this.versions.set(`${created.articleId}:${created.version}`, created);
    return created;
  }

  async findVersion(
    articleId: string,
    version: number,
    organizationId?: string,
  ): Promise<KnowledgeArticleVersion | null> {
    const v = this.versions.get(`${articleId}:${version}`);
    if (!v) return null;
    if (organizationId && v.organizationId !== organizationId) return null;
    return v;
  }

  async listVersions(articleId: string, organizationId?: string): Promise<KnowledgeArticleVersion[]> {
    return Array.from(this.versions.values())
      .filter((v) => v.articleId === articleId && (!organizationId || v.organizationId === organizationId))
      .sort((a, b) => b.version - a.version);
  }
}
