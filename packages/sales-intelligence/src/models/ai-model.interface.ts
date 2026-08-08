export interface ModelUsage {
  totalTokens: number;
}

export interface ModelResponse {
  content: string;
  usage?: ModelUsage;
}

export interface AiModelProvider {
  name: string;
  generate(prompt: string): Promise<ModelResponse>;
  analyze(data: any, instruction: string): Promise<ModelResponse>;
}
