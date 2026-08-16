import { Logger } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ModelTier } from "@oracle69/shared";
import { ModelProvider } from "./model-router.js";

export class GeminiModelProvider implements ModelProvider {
  private readonly logger = new Logger(GeminiModelProvider.name);
  private genAI: GoogleGenerativeAI;
  public readonly name = "gemini";

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string, tier: ModelTier): Promise<{ content: string; usage: any }> {
    const modelName = this.mapTierToModel(tier);
    this.logger.debug(`Calling Gemini model: ${modelName}`);

    try {
      const model = this.genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        usage: {
          total_tokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Gemini API error for tier ${tier}:`, error);
      throw error;
    }
  }

  private mapTierToModel(tier: ModelTier): string {
    switch (tier) {
      case "nano":
        return "gemini-1.5-flash";
      case "mini":
        return "gemini-1.5-flash";
      case "gpt-5.6":
        return "gemini-1.5-pro";
      default:
        return "gemini-1.5-flash";
    }
  }
}
