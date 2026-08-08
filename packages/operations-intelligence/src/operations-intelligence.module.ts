import { Module, Global } from '@nestjs/common';
import { RuntimeModule, MemoryManager, MessageBus, MissionManager } from '@oracle69/runtime';
import { SalesIntelligenceModule } from '@oracle69/sales-intelligence';
import { OperationsIntelligenceController } from './controllers/oi.controller.js';
import { OiOperationsEngine } from './services/oi-operations.engine.js';
import { OiWorkflowEngine } from './services/oi-workflow.engine.js';
import { OiAgentEngine } from './services/oi-agent.engine.js';
import { OiInsightEngine } from './services/oi-insight.engine.js';
import { OiReportService } from './services/oi-report.service.js';

@Global()
@Module({
  imports: [RuntimeModule, SalesIntelligenceModule],
  controllers: [OperationsIntelligenceController],
  providers: [
    OiOperationsEngine,
    OiWorkflowEngine,
    OiAgentEngine,
    {
      provide: OiInsightEngine,
      useFactory: (
        provider: any,
        operations: OiOperationsEngine,
        workflows: OiWorkflowEngine,
        agents: OiAgentEngine,
        bus: MessageBus,
        memory: MemoryManager
      ) => new OiInsightEngine(provider, operations, workflows, agents, bus, memory),
      inject: ['AiModelProvider', OiOperationsEngine, OiWorkflowEngine, OiAgentEngine, MessageBus, MemoryManager],
    },
    OiReportService,
  ],
  exports: [
    OiOperationsEngine,
    OiWorkflowEngine,
    OiAgentEngine,
    OiInsightEngine,
    OiReportService,
  ],
})
export class OperationsIntelligenceModule {}
