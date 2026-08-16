import { Inject, Injectable } from "@nestjs/common";
import {
  KNOWLEDGE_ARTICLE_REPOSITORY,
  type ArticleRepository,
} from "../repositories/article.repository.js";
import {
  KNOWLEDGE_INDEX_REPOSITORY,
  type IndexRepository,
} from "../repositories/index.repository.js";
import { KnowledgeArticle } from "../types.js";
import { EventBus, TenantContextService } from "@oracle69/runtime";
import { KnowledgeEventType } from "../events/knowledge.events.js";

const EVENT_SOURCE = "knowledge-intelligence";
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "was",
  "were",
  "with",
  "that",
  "this",
  "these",
  "those",
  "from",
  "into",
  "onto",
  "out",
  "off",
  "over",
  "under",
  "about",
  "who",
  "whom",
  "whose",
  "which",
  "what",
  "when",
  "where",
  "why",
  "how",
  "not",
  "but",
  "our",
  "their",
  "your",
  "its",
  "his",
  "her",
  "them",
  "they",
  "you",
  "we",
  "us",
  "to",
  "of",
  "in",
  "on",
  "by",
  "at",
  "as",
  "an",
  "a",
]);

export interface TokenWeight {
  token: string;
  weight: number;
}

/**
 * Builds and maintains the tenant-scoped keyword index used by the knowledge
 * search service. Tokenization extracts weighted terms from article titles,
 * summaries, content and tags; the resulting entries are persisted through the
 * existing repository architecture (Prisma-backed in production).
 */
@Injectable()
export class IndexService {
  constructor(
    @Inject(KNOWLEDGE_ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
    @Inject(KNOWLEDGE_INDEX_REPOSITORY) private readonly indexRepo: IndexRepository,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  }

  buildTokens(
    article: Pick<KnowledgeArticle, "title" | "summary" | "content" | "tags">,
  ): TokenWeight[] {
    const fields: Array<[string, number]> = [
      [article.title, 5],
      [article.summary ?? "", 3],
      [article.content, 1],
      [(article.tags ?? []).join(" "), 4],
    ];
    const counts = new Map<string, number>();
    let total = 0;
    for (const [text, multiplier] of fields) {
      for (const token of this.tokenize(text)) {
        counts.set(token, (counts.get(token) ?? 0) + multiplier);
        total += multiplier;
      }
    }
    if (total === 0) return [];
    return Array.from(counts.entries())
      .map(([token, count]) => ({ token, weight: count / total }))
      .sort((a, b) => b.weight - a.weight);
  }

  async reindexArticle(articleId: string, organizationId?: string): Promise<void> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const article = await this.articleRepo.findById(articleId, tenantId);
    if (!article) throw new Error("Article not found");

    const tokens = this.buildTokens(article);
    await this.indexRepo.replaceForArticle(
      articleId,
      tenantId,
      tokens.map((t) => ({
        articleId,
        token: t.token,
        weight: t.weight,
        organizationId: tenantId,
      })),
    );
    await this.eventBus.publish(
      KnowledgeEventType.INDEX_UPDATED,
      { articleId, tokenCount: tokens.length },
      { tenantId, source: EVENT_SOURCE },
    );
  }

  async reindexAll(organizationId?: string): Promise<number> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const articles = await this.articleRepo.findByOrganization(tenantId);
    for (const article of articles) {
      await this.reindexArticle(article.id, tenantId);
    }
    return articles.length;
  }
}
