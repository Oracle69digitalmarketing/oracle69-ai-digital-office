import { Module } from '@nestjs/common';
import { AgentRegistry } from './agent-registry';
import { ModelRouter } from './model-router';
import { PromptLoader } from './prompt-loader';

@Module({
  providers: [AgentRegistry, ModelRouter, PromptLoader],
  exports: [AgentRegistry, ModelRouter, PromptLoader],
})
export class AgentEngineModule {}
