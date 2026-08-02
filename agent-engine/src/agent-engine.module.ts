import { Module } from '@nestjs/common';
import { AgentRegistry } from './agent-registry.js';
import { ModelRouter } from './model-router.js';
import { PromptLoader } from './prompt-loader.js';
import { DepartmentRegistrationService } from './department-registration.service.js';

@Module({
  providers: [AgentRegistry, ModelRouter, PromptLoader, DepartmentRegistrationService],
  exports: [AgentRegistry, ModelRouter, PromptLoader, DepartmentRegistrationService],
})
export class AgentEngineModule {}
