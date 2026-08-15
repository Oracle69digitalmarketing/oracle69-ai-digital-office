import { Logger } from '@nestjs/common';
import { ModelTier } from '@oracle69/shared';
import { ModelProvider } from './model-router.js';

export class GroqModelProvider implements ModelProvider {
  private readonly logger = new Logger(GroqModelProvider.name);
  public readonly name = 'groq';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, tier: ModelTier): Promise<{ content: string; usage: any }> {
    const modelName = this.mapTierToModel(tier);
    this.logger.debug(`Calling Groq model: ${modelName}`);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content || '';

      return {
        content,
        usage: {
          total_tokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Groq API error for tier ${tier}:`, error);
      throw error;
    }
  }

  private mapTierToModel(tier: ModelTier): string {
    switch (tier) {
      case 'nano':
        return 'llama-3.1-8b-instant';
      case 'mini':
        return 'llama-3.3-70b-versatile';
      case 'gpt-5.6':
        return 'llama-3.3-70b-versatile';
      default:
        return 'llama-3.1-8b-instant';
    }
  }
}
