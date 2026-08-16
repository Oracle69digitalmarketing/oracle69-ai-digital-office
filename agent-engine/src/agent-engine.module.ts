import { Module, OnModuleInit } from "@nestjs/common";
import { AgentRegistry } from "./agent-registry.js";
import { ModelRouter } from "./model-router.js";
import { PromptLoader } from "./prompt-loader.js";
import { DepartmentRegistrationService } from "./department-registration.service.js";
import { GeminiModelProvider } from "./gemini-model-provider.js";
import { GroqModelProvider } from "./groq-model-provider.js";
import { MemoryModule } from "@oracle69/memory";

@Module({
  imports: [MemoryModule],
  providers: [AgentRegistry, ModelRouter, PromptLoader, DepartmentRegistrationService],
  exports: [AgentRegistry, ModelRouter, PromptLoader, DepartmentRegistrationService],
})
export class AgentEngineModule implements OnModuleInit {
  constructor(private readonly modelRouter: ModelRouter) {}

  onModuleInit() {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (geminiApiKey) {
      this.modelRouter.registerProvider(new GeminiModelProvider(geminiApiKey));
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      this.modelRouter.registerProvider(new GroqModelProvider(groqApiKey));
    }
  }
}
