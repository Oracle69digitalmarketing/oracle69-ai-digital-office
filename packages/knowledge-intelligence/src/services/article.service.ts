import { Inject, Injectable } from '@nestjs/common';
import {
  KNOWLEDGE_ARTICLE_REPOSITORY,
  type ArticleRepository,
} from '../repositories/article.repository.js';
import { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleVersion } from '../types.js';
import { EventBus, TenantContextService } from '@oracle69/runtime';
import { KnowledgeEventType } from '../events/knowledge.events.js';

const EVENT_SOURCE = 'knowledge-intelligence';

export interface UpdateArticleData {
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

/**
 * Manages the tenant-scoped knowledge article/document lifecycle:
 * create (draft), update (versioning), publish, archive and version history.
 * Every transition is published through the canonical EventBus with the tenant
 * resolved through the existing {@link TenantContextService}.
 */
@Injectable()
export class ArticleService {
  constructor(
    @Inject(KNOWLEDGE_ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createArticle(
    data: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'version'> & {
      organizationId?: string;
      version?: number;
    },
  ): Promise<KnowledgeArticle> {
    const tenantId = this.tenantContext.resolveTenantId(data.organizationId);
    const created = await this.articleRepo.create({
      title: data.title,
      summary: data.summary,
      content: data.content,
      category: data.category,
      tags: data.tags ?? [],
      status: data.status ?? KnowledgeArticleStatus.DRAFT,
      version: data.version ?? 1,
      authorId: data.authorId,
      publishedAt: data.status === KnowledgeArticleStatus.PUBLISHED ? new Date().toISOString() : undefined,
      organizationId: tenantId,
    });
    await this.eventBus.publish(KnowledgeEventType.ARTICLE_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async publishArticle(id: string, organizationId?: string): Promise<KnowledgeArticle> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const existing = await this.articleRepo.findById(id, tenantId);
    if (!existing) throw new Error('Article not found');
    if (existing.status === KnowledgeArticleStatus.PUBLISHED) return existing;

    const updated = await this.articleRepo.update(id, {
      status: KnowledgeArticleStatus.PUBLISHED,
      publishedAt: new Date().toISOString(),
    });
    await this.eventBus.publish(KnowledgeEventType.ARTICLE_PUBLISHED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async archiveArticle(id: string, organizationId?: string): Promise<KnowledgeArticle> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const existing = await this.articleRepo.findById(id, tenantId);
    if (!existing) throw new Error('Article not found');
    if (existing.status === KnowledgeArticleStatus.ARCHIVED) return existing;

    const updated = await this.articleRepo.update(id, {
      status: KnowledgeArticleStatus.ARCHIVED,
    });
    await this.eventBus.publish(KnowledgeEventType.ARTICLE_ARCHIVED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async updateArticle(
    id: string,
    data: UpdateArticleData,
    organizationId?: string,
    changeNote?: string,
  ): Promise<KnowledgeArticle> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const existing = await this.articleRepo.findById(id, tenantId);
    if (!existing) throw new Error('Article not found');

    const nextVersion = existing.version + 1;
    await this.articleRepo.saveVersion({
      articleId: existing.id,
      version: existing.version,
      title: existing.title,
      summary: existing.summary,
      content: existing.content,
      category: existing.category,
      tags: existing.tags,
      changeNote: changeNote ?? `Snapshot of version ${existing.version}`,
      organizationId: tenantId,
    });

    const updated = await this.articleRepo.update(id, {
      title: data.title ?? existing.title,
      summary: data.summary !== undefined ? data.summary : existing.summary,
      content: data.content ?? existing.content,
      category: data.category ?? existing.category,
      tags: data.tags ?? existing.tags,
      version: nextVersion,
    });

    await this.eventBus.publish(KnowledgeEventType.ARTICLE_VERSION_CREATED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    await this.eventBus.publish(KnowledgeEventType.ARTICLE_UPDATED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async listArticles(
    organizationId?: string,
    status?: KnowledgeArticleStatus,
    category?: string,
  ): Promise<KnowledgeArticle[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.articleRepo.findByOrganization(tenantId, status, category);
  }

  async getArticle(id: string, organizationId?: string): Promise<KnowledgeArticle> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const article = await this.articleRepo.findById(id, tenantId);
    if (!article) throw new Error('Article not found');
    return article;
  }

  async getVersionHistory(articleId: string, organizationId?: string): Promise<KnowledgeArticleVersion[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const article = await this.articleRepo.findById(articleId, tenantId);
    if (!article) throw new Error('Article not found');
    return this.articleRepo.listVersions(articleId, tenantId);
  }

  async getVersion(
    articleId: string,
    version: number,
    organizationId?: string,
  ): Promise<KnowledgeArticleVersion | KnowledgeArticle> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const article = await this.articleRepo.findById(articleId, tenantId);
    if (!article) throw new Error('Article not found');
    if (version === article.version) return article;
    const snapshot = await this.articleRepo.findVersion(articleId, version, tenantId);
    if (!snapshot) throw new Error('Article version not found');
    return snapshot;
  }
}
