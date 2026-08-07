import { Module, OnModuleInit } from '@nestjs/common';
import { AgentRegistry } from './agent-registry.js';
import { ModelRouter } from './model-router.js';
import { PromptLoader } from './prompt-loader.js';
import { DepartmentRegistrationService } from './department-registration.service.js';
import { GeminiModelProvider } from './gemini-model-provider.js';

@Module({
  providers: [AgentRegistry, ModelRouter, PromptLoader, DepartmentRegistrationService],
  exports: [AgentRegistry, ModelRouter, PromptLoader, DepartmentRegistrationService],
})
export class AgentEngineModule implements OnModuleInit {
  constructor(private readonly modelRouter: ModelRouter) {}

  onModuleInit() {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.modelRouter.registerProvider(new GeminiModelProvider(geminiApiKey));
    }
  }
}
