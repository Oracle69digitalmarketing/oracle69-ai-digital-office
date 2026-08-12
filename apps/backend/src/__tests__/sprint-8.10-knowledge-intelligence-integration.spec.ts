import "reflect-metadata";
import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Global, Module } from "@nestjs/common";
import {
  KnowledgeIntelligenceModule,
  KnowledgeController,
  KnowledgeEventType,
  KnowledgeArticleStatus,
} from "@oracle69/knowledge-intelligence";
import { EventBus, EventCatalogService, TenantContextService } from "@oracle69/runtime";
import { PrismaClient } from "@prisma/client";

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: {
        knowledgeArticle: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
        },
        knowledgeArticleVersion: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
        },
        knowledgeIndexEntry: {
          create: jest.fn(),
          deleteMany: jest.fn(),
          findMany: jest.fn(),
        },
        knowledgeReport: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
        runtimeEventLog: {
          // @ts-ignore
          upsert: jest.fn().mockResolvedValue({}),
        },
        $transaction: jest.fn(),
        // @ts-ignore
        $connect: jest.fn().mockResolvedValue(undefined),
      } as any,
    },
    {
      provide: "PrismaService",
      useExisting: PrismaClient,
    },
  ],
  exports: [PrismaClient, "PrismaService"],
})
class MockPrismaModule {}

describe("Knowledge Intelligence backend integration (Sprint 8.10)", () => {
  let moduleRef: TestingModule;
  let controller: KnowledgeController;
  let eventBus: EventBus;
  let catalog: EventCatalogService;
  let tenantContext: TenantContextService;
  let prisma: any;
  let published: Array<{ type: string; tenantId?: string }>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MockPrismaModule, KnowledgeIntelligenceModule],
    }).compile();

    await moduleRef.init();

    controller = moduleRef.get(KnowledgeController);
    eventBus = moduleRef.get(EventBus);
    catalog = moduleRef.get(EventCatalogService);
    tenantContext = moduleRef.get(TenantContextService);
    prisma = moduleRef.get(PrismaClient);

    published = [];
    eventBus.allEvents().subscribe((event) => {
      published.push({ type: event.type, tenantId: event.tenantId });
    });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    published.length = 0;
    prisma.knowledgeArticle.findMany.mockResolvedValue([]);
    prisma.knowledgeArticleVersion.findMany.mockResolvedValue([]);
    prisma.knowledgeIndexEntry.findMany.mockResolvedValue([]);
    prisma.$transaction.mockResolvedValue([]);
  });

  it("should wire the KnowledgeController REST surface through the backend module", () => {
    expect(controller).toBeDefined();
    expect(eventBus).toBeDefined();
    expect(tenantContext).toBeDefined();
  });

  it("should register Knowledge domain events in the canonical Event Catalog", () => {
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_CREATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_UPDATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_PUBLISHED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_ARCHIVED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.ARTICLE_VERSION_CREATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.INDEX_UPDATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.REPORT_GENERATED)).toBe(true);
    expect(catalog.isCanonical(KnowledgeEventType.INSIGHT_GENERATED)).toBe(true);
  });

  it("should run the article lifecycle through the controller", async () => {
    prisma.knowledgeArticle.create.mockResolvedValue({
      id: "art-1",
      title: "Onboarding Guide",
      summary: "First week guide",
      content: "Welcome to the team.",
      category: "Operations",
      tags: ["onboarding"],
      status: KnowledgeArticleStatus.DRAFT,
      version: 1,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.knowledgeArticle.findUnique.mockResolvedValue({
      id: "art-1",
      title: "Onboarding Guide",
      summary: "First week guide",
      content: "Welcome to the team.",
      category: "Operations",
      tags: ["onboarding"],
      status: KnowledgeArticleStatus.DRAFT,
      version: 1,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await controller.createArticle("org-1", {
      title: "Onboarding Guide",
      summary: "First week guide",
      content: "Welcome to the team.",
      category: "Operations",
      tags: ["onboarding"],
    });
    expect(created.status).toBe(KnowledgeArticleStatus.DRAFT);
    expect(prisma.knowledgeArticle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", status: "draft", version: 1 }),
      }),
    );

    prisma.knowledgeArticle.update.mockResolvedValue({
      id: "art-1",
      title: "Onboarding Guide",
      summary: "First week guide",
      content: "Welcome to the team.",
      category: "Operations",
      tags: ["onboarding"],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      publishedAt: new Date(),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const publishedArticle = await controller.publishArticle("org-1", created.id);
    expect(publishedArticle.status).toBe(KnowledgeArticleStatus.PUBLISHED);
    expect(prisma.knowledgeArticle.update).toHaveBeenCalledTimes(1);

    prisma.knowledgeArticle.update.mockResolvedValue({
      id: "art-1",
      title: "Onboarding Guide",
      summary: "First week guide",
      content: "Welcome to the team.",
      category: "Operations",
      tags: ["onboarding"],
      status: KnowledgeArticleStatus.ARCHIVED,
      version: 1,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const archived = await controller.archiveArticle("org-1", created.id);
    expect(archived.status).toBe(KnowledgeArticleStatus.ARCHIVED);

    expect(published.some((e) => e.type === KnowledgeEventType.ARTICLE_CREATED && e.tenantId === "org-1")).toBe(true);
    expect(published.some((e) => e.type === KnowledgeEventType.ARTICLE_PUBLISHED)).toBe(true);
    expect(published.some((e) => e.type === KnowledgeEventType.ARTICLE_ARCHIVED)).toBe(true);
  });

  it("should version articles through the controller", async () => {
    prisma.knowledgeArticle.findUnique.mockResolvedValue({
      id: "art-v",
      title: "Policy v1",
      summary: "Original",
      content: "Original content",
      category: "Policy",
      tags: ["policy"],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.knowledgeArticleVersion.create.mockResolvedValue({
      id: "ver-1",
      articleId: "art-v",
      version: 1,
      title: "Policy v1",
      summary: "Original",
      content: "Original content",
      category: "Policy",
      tags: ["policy"],
      changeNote: "Snapshot of version 1",
      organizationId: "org-1",
      createdAt: new Date(),
    });
    prisma.knowledgeArticle.update.mockResolvedValue({
      id: "art-v",
      title: "Policy v2",
      summary: "Original",
      content: "Updated content",
      category: "Policy",
      tags: ["policy"],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 2,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = await controller.updateArticle("org-1", "art-v", { content: "Updated content" });
    expect(updated.version).toBe(2);
    expect(prisma.knowledgeArticleVersion.create).toHaveBeenCalledTimes(1);
    expect(published.some((e) => e.type === KnowledgeEventType.ARTICLE_VERSION_CREATED)).toBe(true);
    expect(published.some((e) => e.type === KnowledgeEventType.ARTICLE_UPDATED)).toBe(true);

    prisma.knowledgeArticle.findUnique.mockResolvedValue({
      id: "art-v",
      title: "Policy v2",
      summary: "Original",
      content: "Updated content",
      category: "Policy",
      tags: ["policy"],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 2,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.knowledgeArticleVersion.findUnique.mockResolvedValue({
      id: "ver-1",
      articleId: "art-v",
      version: 1,
      title: "Policy v1",
      summary: "Original",
      content: "Original content",
      category: "Policy",
      tags: ["policy"],
      changeNote: "Snapshot of version 1",
      organizationId: "org-1",
      createdAt: new Date(),
    });

    const v1 = await controller.getVersion("org-1", "art-v", "1");
    expect((v1 as any).version).toBe(1);
    expect((v1 as any).content).toBe("Original content");

    const current = await controller.getVersion("org-1", "art-v", "2");
    expect((current as any).version).toBe(2);
    expect((current as any).content).toBe("Updated content");
  });

  it("should index and search articles through the controller", async () => {
    prisma.knowledgeArticle.findUnique.mockResolvedValue({
      id: "art-s",
      title: "Sales Playbook",
      summary: "How to sell",
      content: "The sales playbook explains negotiation best practices.",
      category: "Sales",
      tags: ["sales"],
      status: KnowledgeArticleStatus.PUBLISHED,
      version: 1,
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.reindexArticle("org-1", "art-s");
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(published.some((e) => e.type === KnowledgeEventType.INDEX_UPDATED)).toBe(true);

    prisma.knowledgeArticle.findMany.mockResolvedValue([
      {
        id: "art-s",
        title: "Sales Playbook",
        summary: "How to sell",
        content: "The sales playbook explains negotiation best practices.",
        category: "Sales",
        tags: ["sales"],
        status: KnowledgeArticleStatus.PUBLISHED,
        version: 1,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    prisma.knowledgeIndexEntry.findMany.mockResolvedValue([
      { id: "idx-1", articleId: "art-s", token: "sales", weight: 0.5, organizationId: "org-1" },
      { id: "idx-2", articleId: "art-s", token: "playbook", weight: 0.3, organizationId: "org-1" },
    ]);

    const results = await controller.search("org-1", "sales", KnowledgeArticleStatus.PUBLISHED);
    expect(results.length).toBe(1);
    expect(results[0].articleId).toBe("art-s");
    expect(results[0].score).toBeGreaterThan(0);
    expect(prisma.knowledgeIndexEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ token: { in: expect.any(Array) } }) }),
    );
  });

  it("should compute knowledge KPIs and health through the controller", async () => {
    prisma.knowledgeArticle.findMany.mockResolvedValue([
      {
        id: "art-a",
        title: "A",
        summary: "s",
        content: "c",
        category: "Operations",
        tags: [],
        status: KnowledgeArticleStatus.PUBLISHED,
        version: 1,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "art-b",
        title: "B",
        summary: "s",
        content: "c",
        category: "Sales",
        tags: [],
        status: KnowledgeArticleStatus.DRAFT,
        version: 2,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    prisma.knowledgeIndexEntry.findMany.mockResolvedValue([
      { id: "idx", articleId: "art-a", token: "ops", weight: 1, organizationId: "org-1" },
    ]);

    const kpis = await controller.getKpis("org-1");
    expect(kpis.totalArticles).toBe(2);
    expect(kpis.publishedCount).toBe(1);
    expect(kpis.draftCount).toBe(1);
    expect(kpis.indexedArticles).toBe(1);
    expect(kpis.indexCoverage).toBe(0.5);

    const health = await controller.getHealth("org-1");
    expect(health.kpis.totalArticles).toBe(2);
    expect(health.reasoning.length).toBeGreaterThan(0);
  });

  it("should enforce strict tenant isolation for knowledge resources", async () => {
    prisma.knowledgeArticle.findUnique.mockResolvedValue({
      id: "art-owner",
      title: "Owner Doc",
      summary: "s",
      content: "c",
      category: "Policy",
      tags: [],
      status: KnowledgeArticleStatus.DRAFT,
      version: 1,
      organizationId: "org-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(await controller.listArticles("org-attacker")).toEqual([]);
    await expect(controller.getArticle("org-attacker", "art-owner")).rejects.toThrow("Article not found");
    await expect(controller.publishArticle("org-attacker", "art-owner")).rejects.toThrow("Article not found");
    await expect(controller.updateArticle("org-attacker", "art-owner", { title: "Hacked" })).rejects.toThrow(
      "Article not found",
    );
    await expect(controller.reindexArticle("org-attacker", "art-owner")).rejects.toThrow("Article not found");
  });

  it("should generate deterministic insights and recommendations without an AI provider", async () => {
    delete process.env.GOOGLE_AI_API_KEY;

    prisma.knowledgeArticle.findMany.mockResolvedValue([
      {
        id: "art-c",
        title: "C",
        summary: "s",
        content: "c",
        category: "Operations",
        tags: [],
        status: KnowledgeArticleStatus.PUBLISHED,
        version: 1,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const insights = await controller.getInsights("org-1");
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.every((i: any) => typeof i.content === "string" && i.content.length > 0)).toBe(true);

    const recommendations = await controller.getRecommendations("org-1");
    expect(recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it("should generate and persist a knowledge report through the controller", async () => {
    prisma.knowledgeArticle.findMany.mockResolvedValue([
      {
        id: "art-r",
        title: "R",
        summary: "s",
        content: "c",
        category: "Operations",
        tags: [],
        status: KnowledgeArticleStatus.PUBLISHED,
        version: 1,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    prisma.knowledgeReport.create.mockResolvedValue({
      id: "report-1",
      period: "2026-08",
      knowledgeScore: 80,
      organizationId: "org-1",
      createdAt: new Date(),
    });
    prisma.knowledgeReport.findMany.mockResolvedValue([
      {
        id: "report-1",
        period: "2026-08",
        knowledgeScore: 80,
        summary: { kpis: {}, health: {} },
        organizationId: "org-1",
        createdAt: new Date(),
      },
    ]);

    const report = await controller.generateReport("org-1", { period: "2026-08" });
    expect(report.period).toBe("2026-08");
    expect(report.knowledgeScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.kpis.totalArticles).toBe(1);
    expect(published.some((e) => e.type === KnowledgeEventType.REPORT_GENERATED)).toBe(true);

    const reports = await controller.listReports("org-1");
    expect(reports.length).toBe(1);
  });
});
