import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiModelProvider, ModelResponse } from './ai-model.interface.js';

export class GeminiModelProvider implements AiModelProvider {
  public readonly name = 'gemini';
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string): Promise<ModelResponse> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      content: response.text(),
      usage: {
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  async analyze(data: any, instruction: string): Promise<ModelResponse> {
    const prompt = `
      Instruction: ${instruction}
      Data: ${JSON.stringify(data, null, 2)}
      
      Analyze the data above based on the instruction.
      Respond only with valid JSON.
    `;
    return this.generate(prompt);
  }
}
