import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, MemoryManager } from '@oracle69/runtime';
import type { AiModelProvider } from '@oracle69/sales-intelligence';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { MarketingIntelligenceEventType, MarketingIntelligenceEvent } from '../events/mi.events.js';
import { MiCampaignEngine, CampaignMetrics } from './mi-campaign.engine.js';
import { MiSeoEngine, SeoMetrics } from './mi-seo.engine.js';
import { MiConversionEngine, ConversionMetrics } from './mi-conversion.engine.js';

export interface GeneratedGrowthInsight {
  type: string;
  content: string;
  confidence: number;
  source: 'ai' | 'deterministic';
}

export interface GeneratedGrowthRecommendation {
  title: string;
  priority: string;
  action: string;
  expectedImpact: string;
  source: 'ai' | 'deterministic';
}

export interface GeneratedContentBrief {
  channel: string;
  topic: string;
  targetAudience: string;
  keyPoints: string[];
}

export interface GeneratedPricingSuggestion {
  product: string;
  currentPrice: number | null;
  suggestedPrice: number | null;
  rationale: string;
  confidence: number;
  source: 'ai' | 'deterministic';
}

export interface GrowthInsightResult {
  insights: GeneratedGrowthInsight[];
  recommendations: GeneratedGrowthRecommendation[];
  contentBriefs: GeneratedContentBrief[];
  pricingSuggestions: GeneratedPricingSuggestion[];
  source: 'ai' | 'deterministic';
}

interface RawInsight {
  type?: string;
  content?: string;
  confidence?: number;
}

interface RawRecommendation {
  title?: string;
  priority?: string;
  action?: string;
  expectedImpact?: string;
}

interface RawContentBrief {
  channel?: string;
  topic?: string;
  targetAudience?: string;
  keyPoints?: unknown;
}

interface RawPricing {
  product?: string;
  currentPrice?: number;
  suggestedPrice?: number;
  rationale?: string;
  confidence?: number;
}

/**
 * Generates growth intelligence: insights, recommendations, content briefs and
 * pricing suggestions for the organization.
 *
 * The AI path runs through the existing `AiModelProvider` abstraction; whenever
 * the model call fails, returns malformed output or produces no content, the
 * engine falls back to deterministic, data-derived output built from the
 * campaign, SEO and conversion metrics. Every item is labelled with its source.
 */
@Injectable()
export class MiGrowthInsightEngine {
  private readonly logger = new Logger(MiGrowthInsightEngine.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly modelProvider: AiModelProvider,
    private readonly campaignEngine: MiCampaignEngine,
    private readonly seoEngine: MiSeoEngine,
    private readonly conversionEngine: MiConversionEngine,
    private readonly messageBus: MessageBus,
    private readonly memory: MemoryManager
  ) {}

  async generateGrowthInsights(organizationId: string, period?: string): Promise<GrowthInsightResult> {
    this.logger.log(`Generating growth insights for organization ${organizationId}`);

    const campaign = await this.campaignEngine.compute(organizationId, period);
    const seo = await this.seoEngine.compute(organizationId, period);
    const conversion = await this.conversionEngine.compute(organizationId, period);
    const opportunities = await this.findOpportunities(organizationId);

    const context = { campaign, seo, conversion, opportunities };

    try {
      const aiResult = await this.runAiGeneration(context);
      await this.persistAndPublish(organizationId, aiResult);
      return aiResult;
    } catch (error) {
      this.logger.warn(`AI growth insight generation failed for organization ${organizationId}; using deterministic fallback: ${(error as Error).message}`);
      const deterministic = await this.buildDeterministicResult(context, organizationId);
      await this.persistAndPublish(organizationId, deterministic);
      return deterministic;
    }
  }

  async listInsights(organizationId: string, take = 50) {
    return this.prisma.miGrowthInsight.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async listPricingSuggestions(organizationId: string, take = 50) {
    return this.prisma.miPricingSuggestion.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  private async findOpportunities(organizationId: string) {
    return this.prisma.crmLead.findMany({
      where: {
        organizationId,
        score: { gte: 75 },
        status: { notIn: ['converted', 'disqualified'] },
      },
      orderBy: { score: 'desc' },
      take: 20,
    });
  }

  private async runAiGeneration(context: unknown): Promise<GrowthInsightResult> {
    const instruction = `
      Analyze the growth intelligence context for this organization from a Chief Marketing Officer perspective.
      Focus on lead generation, campaign ROI, SEO performance, conversion optimization and pricing.
      Return JSON only: {
        "insights": [ { "type": "seo|campaign|cro|opportunity|content|pricing|growth", "content": "string", "confidence": 0.0-1.0 } ],
        "recommendations": [ { "title": "string", "priority": "low|normal|high|critical", "action": "string", "expectedImpact": "string" } ],
        "contentBriefs": [ { "channel": "string", "topic": "string", "targetAudience": "string", "keyPoints": ["string"] } ],
        "pricingSuggestions": [ { "product": "string", "currentPrice": number|null, "suggestedPrice": number|null, "rationale": "string", "confidence": 0.0-1.0 } ]
      }
    `;

    const response = await this.modelProvider.analyze(context, instruction);
    const parsed = JSON.parse(sanitizeJson(response.content));

    const insights = normalizeInsights(parsed.insights, 'ai');
    const recommendations = normalizeRecommendations(parsed.recommendations, 'ai');
    const contentBriefs = normalizeContentBriefs(parsed.contentBriefs);
    const pricingSuggestions = normalizePricing(parsed.pricingSuggestions, 'ai');

    if (insights.length === 0 || recommendations.length === 0) {
      throw new Error('AI returned no growth insights or recommendations');
    }

    return { insights, recommendations, contentBriefs, pricingSuggestions, source: 'ai' };
  }

  private async buildDeterministicResult(context: GrowthContext, organizationId: string): Promise<GrowthInsightResult> {
    const { campaign, seo, conversion, opportunities } = context;

    const insights: GeneratedGrowthInsight[] = [];
    const recommendations: GeneratedGrowthRecommendation[] = [];
    const contentBriefs: GeneratedContentBrief[] = [];

    const totalLeads = conversion.totalLeads;
    const conversions = conversion.conversions;
    const spend = campaign.totals.spend;
    const roasChannels = campaign.channels.filter((c) => c.spend > 0);
    const worstRoas = roasChannels.length > 0 ? Math.min(...roasChannels.map((c) => c.roas)) : 0;

    if (totalLeads > 0 && conversion.conversionRate < 0.15) {
      insights.push({
        type: 'cro',
        content: `Overall conversion rate is ${(conversion.conversionRate * 100).toFixed(1)}% across ${totalLeads} lead(s), below the 15% growth target.`,
        confidence: 0.75,
        source: 'deterministic',
      });
    }

    if (spend > 0 && worstRoas < 1) {
      insights.push({
        type: 'campaign',
        content: `Campaign spend of ${formatCurrency(spend)} is returning less than 1x revenue (worst ROAS ${worstRoas.toFixed(2)}x).`,
        confidence: 0.7,
        source: 'deterministic',
      });
    }

    if (totalLeads > 0 && seo.organicShare < 0.2) {
      insights.push({
        type: 'seo',
        content: `Organic leads represent only ${(seo.organicShare * 100).toFixed(0)}% of the lead base, indicating an under-leveraged SEO channel.`,
        confidence: 0.7,
        source: 'deterministic',
      });
    }

    if (totalLeads === 0) {
      insights.push({
        type: 'campaign',
        content: 'No leads are currently recorded for the organization.',
        confidence: 0.6,
        source: 'deterministic',
      });
    }

    if (opportunities.length > 0) {
      insights.push({
        type: 'opportunity',
        content: `${opportunities.length} sales-ready lead(s) scored ${Math.round(opportunities[0].score ?? 75)}+ are awaiting sales follow-up.`,
        confidence: 0.8,
        source: 'deterministic',
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'growth',
        content: 'Lead generation and conversion are on track with no material growth risks detected.',
        confidence: 0.6,
        source: 'deterministic',
      });
    }

    if (totalLeads > 0 && conversion.conversionRate < 0.15) {
      recommendations.push({
        title: 'Optimise conversion path',
        priority: 'high',
        action: 'A/B test landing pages and lead-capture offers across under-performing sources.',
        expectedImpact: 'Raise the overall conversion rate toward 15%.',
        source: 'deterministic',
      });
    }

    if (spend > 0 && worstRoas < 1) {
      recommendations.push({
        title: 'Reallocate campaign budget',
        priority: 'high',
        action: 'Shift spend from channels returning less than 1x ROAS toward the best-performing sources.',
        expectedImpact: 'Improve return on ad spend and lower acquisition costs.',
        source: 'deterministic',
      });
    }

    if (totalLeads === 0) {
      recommendations.push({
        title: 'Kickstart lead generation',
        priority: 'critical',
        action: 'Launch campaigns across at least two channels and register them in campaign management.',
        expectedImpact: 'Restore inbound lead volume.',
        source: 'deterministic',
      });
    }

    if (opportunities.length > 0) {
      recommendations.push({
        title: 'Follow up on sales-ready leads',
        priority: 'normal',
        action: 'Queue sales outreach for the scored SQL leads detected by opportunity detection.',
        expectedImpact: 'Convert ready leads into pipeline faster.',
        source: 'deterministic',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain growth cadence',
        priority: 'normal',
        action: 'Continue the current marketing plan and review next period.',
        expectedImpact: 'Sustain current growth performance.',
        source: 'deterministic',
      });
    }

    for (const channel of campaign.channels) {
      if (channel.leads > 0 || channel.conversions > 0) {
        contentBriefs.push({
          channel: channel.channel,
          topic: `Growth playbook: ${channel.channel}`,
          targetAudience: 'Prospective customers in the active pipeline',
          keyPoints: [
            `${channel.leads} lead(s) and ${channel.conversions} conversion(s) from ${channel.channel} this period.`,
            `Current conversion rate on this channel is ${(channel.conversionRate * 100).toFixed(1)}%.`,
            'Create channel-specific landing content that addresses the strongest pain points.',
            'Test offers against the current baseline before scaling spend.',
          ],
        });
      }
    }

    const pricingSuggestions = await this.buildDeterministicPricing(context, organizationId);

    return {
      insights,
      recommendations,
      contentBriefs,
      pricingSuggestions,
      source: 'deterministic',
    };
  }

  private async buildDeterministicPricing(context: GrowthContext, organizationId: string): Promise<GeneratedPricingSuggestion[]> {
    const suggestions: GeneratedPricingSuggestion[] = [];
    const topOpportunities = await this.prisma.crmOpportunity.findMany({
      where: { organizationId, stage: 'won' },
      orderBy: { value: 'desc' },
      take: 3,
    });
    for (const opportunity of topOpportunities) {
      suggestions.push({
        product: opportunity.name,
        currentPrice: opportunity.value,
        suggestedPrice: opportunity.value,
        rationale: 'Maintain current reference pricing while conversion data matures; revisit after the next campaign cycle.',
        confidence: 0.5,
        source: 'deterministic',
      });
    }

    if (context.conversion.totalLeads > 0 && context.conversion.conversionRate < 0.1 && topOpportunities.length > 0) {
      const reference = topOpportunities[0];
      suggestions.push({
        product: reference.name,
        currentPrice: reference.value,
        suggestedPrice: round(reference.value * 1.05),
        rationale: 'Low conversion may indicate a perceived value mismatch; consider a modest price adjustment or added-value bundling.',
        confidence: 0.4,
        source: 'deterministic',
      });
    }

    return suggestions;
  }

  private async persistAndPublish(organizationId: string, result: GrowthInsightResult): Promise<void> {
    await this.prisma.miGrowthInsight.createMany({
      data: result.insights.map((insight) => ({
        organizationId,
        type: insight.type,
        content: insight.content,
        confidence: insight.confidence,
        source: insight.source,
      })),
    });

    if (result.pricingSuggestions.length > 0) {
      await this.prisma.miPricingSuggestion.createMany({
        data: result.pricingSuggestions.map((suggestion) => ({
          organizationId,
          product: suggestion.product,
          currentPrice: suggestion.currentPrice,
          suggestedPrice: suggestion.suggestedPrice,
          rationale: suggestion.rationale,
          confidence: suggestion.confidence,
          source: suggestion.source,
        })),
      });
    }

    await this.memory.save({
      id: uuidv4(),
      type: 'business',
      content:
        `Growth intelligence for ${organizationId}: ${result.insights.length} insight(s), ` +
        `${result.recommendations.length} recommendation(s), ${result.contentBriefs.length} content brief(s) and ` +
        `${result.pricingSuggestions.length} pricing suggestion(s) generated via ${result.source}.`,
      timestamp: new Date().toISOString(),
      metadata: {
        organizationId,
        source: result.source,
        insightCount: result.insights.length,
        recommendationCount: result.recommendations.length,
        contentBriefCount: result.contentBriefs.length,
        pricingSuggestionCount: result.pricingSuggestions.length,
      },
    });

    this.messageBus.publish(
      MarketingIntelligenceEventType.INSIGHT_GENERATED,
      new MarketingIntelligenceEvent(MarketingIntelligenceEventType.INSIGHT_GENERATED, {
        organizationId,
        insights: result.insights,
        recommendations: result.recommendations,
        contentBriefs: result.contentBriefs,
        source: result.source,
      })
    );

    if (result.pricingSuggestions.length > 0) {
      this.messageBus.publish(
        MarketingIntelligenceEventType.PRICING_SUGGESTION_GENERATED,
        new MarketingIntelligenceEvent(MarketingIntelligenceEventType.PRICING_SUGGESTION_GENERATED, {
          organizationId,
          pricingSuggestions: result.pricingSuggestions,
          source: result.source,
        })
      );
    }
  }
}

interface GrowthContext {
  campaign: CampaignMetrics;
  seo: SeoMetrics;
  conversion: ConversionMetrics;
  opportunities: any[];
}

function sanitizeJson(content: string): string {
  return content.replace(/```json/g, '').replace(/```/g, '').trim();
}

function normalizeInsights(raw: RawInsight[] | undefined, source: 'ai' | 'deterministic'): GeneratedGrowthInsight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.content === 'string' && item.content.trim().length > 0)
    .map((item) => {
      const confidence =
        typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1
          ? item.confidence
          : 0.5;
      return {
        type: typeof item.type === 'string' && item.type.length > 0 ? item.type : 'growth',
        content: item.content as string,
        confidence,
        source,
      };
    });
}

function normalizeRecommendations(
  raw: RawRecommendation[] | undefined,
  source: 'ai' | 'deterministic'
): GeneratedGrowthRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.action === 'string' && item.action.trim().length > 0)
    .map((item) => {
      const priority = normalizePriority(item.priority);
      return {
        title: typeof item.title === 'string' && item.title.length > 0 ? item.title : 'Recommended action',
        priority,
        action: item.action as string,
        expectedImpact:
          typeof item.expectedImpact === 'string' && item.expectedImpact.length > 0
            ? item.expectedImpact
            : 'Improved growth performance',
        source,
      };
    });
}

function normalizeContentBriefs(raw: RawContentBrief[] | undefined): GeneratedContentBrief[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.topic === 'string' && item.topic.trim().length > 0)
    .map((item) => ({
      channel: typeof item.channel === 'string' && item.channel.length > 0 ? item.channel : 'web',
      topic: item.topic as string,
      targetAudience:
        typeof item.targetAudience === 'string' && item.targetAudience.length > 0
          ? item.targetAudience
          : 'Prospective customers',
      keyPoints: Array.isArray(item.keyPoints)
        ? item.keyPoints.filter((point): point is string => typeof point === 'string')
        : [],
    }));
}

function normalizePricing(raw: RawPricing[] | undefined, source: 'ai' | 'deterministic'): GeneratedPricingSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item?.product === 'string' && item.product.trim().length > 0)
    .map((item) => {
      const confidence =
        typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1
          ? item.confidence
          : 0.5;
      return {
        product: item.product as string,
        currentPrice: typeof item.currentPrice === 'number' ? item.currentPrice : null,
        suggestedPrice: typeof item.suggestedPrice === 'number' ? item.suggestedPrice : null,
        rationale:
          typeof item.rationale === 'string' && item.rationale.length > 0
            ? item.rationale
            : 'Pricing consideration for this product',
        confidence,
        source,
      };
    });
}

function normalizePriority(priority: unknown): string {
  if (priority === 'low' || priority === 'high' || priority === 'critical') return priority;
  return 'normal';
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
