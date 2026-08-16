import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";

@Injectable()
export class GeminiEmbeddingProvider {
  private readonly logger = new Logger(GeminiEmbeddingProvider.name);
  private genAI: GoogleGenerativeAI;
  private readonly modelName = "text-embedding-004";

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async embed(text: string): Promise<number[]> {
    this.logger.debug(`Generating embedding for text: ${text.substring(0, 50)}...`);
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error("Failed to generate embedding with Gemini", error);
      throw error;
    }
  }
}
