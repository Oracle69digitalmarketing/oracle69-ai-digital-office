import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { createKnowledgeTestModule, KnowledgeTestContext } from "../testing/test-fixture.js";
import { KnowledgeAiService } from "../services/knowledge-ai.service.js";
import { KnowledgeArticleStatus, KnowledgeHealth } from "../types.js";

describe("Knowledge AI insights", () => {
  let ctx: KnowledgeTestContext;
  const orgId = "org-ai-1";
  const originalKey = process.env.GOOGLE_AI_API_KEY;

  beforeEach(() => {
    ctx = createKnowledgeTestModule();
  });

  afterEach(() => {
    ctx.close();
    if (originalKey === undefined) {
      delete process.env.GOOGLE_AI_API_KEY;
    } else {
      process.env.GOOGLE_AI_API_KEY = originalKey;
    }
  });

  function emptyHealth(): KnowledgeHealth {
    return {
      score: 20,
      status: "critical",
      kpis: {
        totalArticles: 0,
        draftCount: 0,
        publishedCount: 0,
        archivedCount: 0,
        categories: [],
        averageVersionCount: 0,
        indexedArticles: 0,
        indexCoverage: 0,
        staleArticles: 0,
        draftBacklog: 0,
      },
      reasoning: [],
    };
  }

  it("should return deterministic insights without an AI provider", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    const insights = await ctx.aiService.generateInsights(emptyHealth());
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.some((i) => i.type === "alert")).toBe(true);
    expect(insights.every((i) => typeof i.content === "string" && i.content.length > 0)).toBe(true);
  });

  it("should fall back to deterministic insights when the provider fails", async () => {
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const failing = {
      name: "fake",
      async generate() {
        throw new Error("model unavailable");
      },
      async analyze() {
        throw new Error("model unavailable");
      },
    };
    const aiService = new KnowledgeAiService(failing as any);

    const insights = await aiService.generateInsights(emptyHealth());
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.some((i) => i.type === "alert")).toBe(true);
  });

  it("should fall back to deterministic insights when the provider returns invalid JSON", async () => {
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const invalid = {
      name: "fake",
      async generate() {
        return { content: "not json" };
      },
      async analyze() {
        return { content: "not json" };
      },
    };
    const aiService = new KnowledgeAiService(invalid as any);

    const insights = await aiService.generateInsights(emptyHealth());
    expect(insights.length).toBeGreaterThanOrEqual(3);
  });

  it("should normalize insights returned by the provider", async () => {
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const valid = {
      name: "fake",
      async generate() {
        return { content: "" };
      },
      async analyze() {
        return {
          content: JSON.stringify([
            {
              type: "alert",
              title: "Coverage Gap",
              content: "Re-index content.",
              priority: "high",
              impact: "Search",
            },
            { type: "bad", title: "", content: "Keep publishing.", priority: "critical" },
          ]),
        };
      },
    };
    const aiService = new KnowledgeAiService(valid as any);

    const insights = await aiService.generateInsights(emptyHealth());
    expect(insights).toHaveLength(2);
    expect(insights[0]).toMatchObject({ type: "alert", title: "Coverage Gap", priority: "high" });
    expect(insights[1]).toMatchObject({ type: "recommendation", priority: "normal" });
  });

  it("should fall back when the provider returns no usable insights", async () => {
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const empty = {
      name: "fake",
      async generate() {
        return { content: "" };
      },
      async analyze() {
        return { content: JSON.stringify([]) };
      },
    };
    const aiService = new KnowledgeAiService(empty as any);

    const insights = await aiService.generateInsights(emptyHealth());
    expect(insights.length).toBeGreaterThanOrEqual(3);
  });

  it("should generate insights for a healthy knowledge base", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    const health: KnowledgeHealth = {
      score: 90,
      status: "healthy",
      kpis: {
        totalArticles: 10,
        draftCount: 1,
        publishedCount: 9,
        archivedCount: 0,
        categories: ["Ops", "Sales"],
        averageVersionCount: 2.5,
        indexedArticles: 10,
        indexCoverage: 1,
        staleArticles: 0,
        draftBacklog: 1,
      },
      reasoning: [],
    };

    const insights = await ctx.aiService.generateInsights(health);
    expect(insights.some((i) => i.type === "forecast")).toBe(true);
    expect(insights.some((i) => i.title === "Search Coverage Gap")).toBe(false);
    expect(insights.some((i) => i.title === "Stale Content")).toBe(false);
  });
});
