import { AiModelProvider, ModelResponse } from './ai-model.interface.js';

export class GroqModelProvider implements AiModelProvider {
  public readonly name = 'groq';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string): Promise<ModelResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
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
