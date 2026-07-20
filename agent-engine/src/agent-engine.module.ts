import { Module } from '@nestjs/common';
import { AgentRegistry } from './agent-registry.js';
import { ModelRouter } from './model-router.js';
import { PromptLoader } from './prompt-loader.js';

@Module({
  providers: [AgentRegistry, ModelRouter, PromptLoader],
  exports: [AgentRegistry, ModelRouter, PromptLoader],
})
export class AgentEngineModule {}
