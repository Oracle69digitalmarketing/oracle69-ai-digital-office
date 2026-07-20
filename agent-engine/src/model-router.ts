import { Injectable, Logger } from '@nestjs/common';
import { ModelTier, ModelRoutingRequest, ModelUsage } from '@oracle69/shared';

export interface ModelProvider {
  name: string;
  generate(prompt: string, tier: ModelTier): Promise<{ content: string; usage: any }>;
}

@Injectable()
export class ModelRouter {
  private readonly logger = new Logger(ModelRouter.name);
  private providers: Map<string, ModelProvider> = new Map();
  private usageMetrics: ModelUsage[] = [];

  registerProvider(provider: ModelProvider) {
    this.providers.set(provider.name, provider);
    this.logger.log(`Registered model provider: ${provider.name}`);
  }

  route(request: ModelRoutingRequest): ModelTier {
    this.logger.debug(`Routing task: ${request.taskId} (${request.taskDescription})`);
    
    // Cost-aware and complexity-based routing logic
    if (request.complexity > 8 || request.department === 'CEO' || request.department === 'Chief of Staff') {
      return 'gpt-5.6';
    } else if (request.complexity > 4 || request.businessRisk === 'high') {
      return 'mini';
    }
    
    return 'nano';
  }

  async execute(agentId: string, prompt: string, request: ModelRoutingRequest): Promise<string> {
    const tier = this.route(request);
    const provider = this.getBestProvider(tier);

    try {
      const startTime = Date.now();
      const result = await provider.generate(prompt, tier);
      const duration = Date.now() - startTime;

      this.trackUsage({
        taskId: request.taskId,
        agentId,
        model: `${provider.name}-${tier}`,
        tokensUsed: result.usage?.total_tokens || 0,
        cost: this.calculateCost(tier, result.usage),
        duration,
      });

      return result.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Model execution failed for ${tier}. Attempting fallback...`, errorMessage);
      return this.handleFallback(agentId, prompt, request, tier);
    }
  }

  private getBestProvider(tier: ModelTier): ModelProvider {
    // Logic to select provider based on tier availability and cost
    const provider = Array.from(this.providers.values())[0]; // Simple for now
    if (!provider) throw new Error('No model providers registered');
    return provider;
  }

  private async handleFallback(agentId: string, prompt: string, request: ModelRoutingRequest, failedTier: ModelTier): Promise<string> {
    if (failedTier === 'nano') {
      this.logger.log('Fallback: nano -> mini');
      return this.execute(agentId, prompt, { ...request, complexity: 5 });
    } else if (failedTier === 'mini') {
      this.logger.log('Fallback: mini -> gpt-5.6');
      return this.execute(agentId, prompt, { ...request, complexity: 9 });
    }
    throw new Error(`Critical failure: Model execution failed for all tiers including ${failedTier}`);
  }

  private trackUsage(usage: ModelUsage) {
    this.usageMetrics.push(usage);
    this.logger.debug(`Usage tracked for ${usage.taskId}: ${usage.tokensUsed} tokens`);
  }

  private calculateCost(tier: ModelTier, usage: any): number {
    // Placeholder cost calculation logic
    const rates = {
      'nano': 0.0001,
      'mini': 0.001,
      'gpt-5.6': 0.01
    };
    return (usage?.total_tokens || 0) * (rates[tier] / 1000);
  }

  getMetrics(): ModelUsage[] {
    return this.usageMetrics;
  }
}
