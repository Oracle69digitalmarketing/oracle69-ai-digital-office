import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { AgentRegistry } from './agent-registry.js';
import { DepartmentManifest } from './department.js';
import { DepartmentAgent } from './agents/department-agent.js';
import { ChiefOfStaffAgent } from './agents/chief-of-staff-agent.js';
import { ProjectManagerAgent } from './agents/project-manager-agent.js';
import { ModelRouter } from './model-router.js';
import { PromptLoader } from './prompt-loader.js';
import { AgentMetadata } from '@oracle69/shared';

@Injectable()
export class DepartmentRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(DepartmentRegistrationService.name);

  private readonly departments: DepartmentManifest[] = [
    {
      id: 'cos-001',
      name: 'Chief of Staff',
      promptReference: 'chief-of-staff',
      capabilities: ['orchestration', 'planning', 'strategic_alignment'],
      kpis: ['task_completion_rate', 'alignment_score'],
      escalationPath: 'ceo',
      agentClass: ChiefOfStaffAgent,
    },
    {
      id: 'pm-001',
      name: 'Project Manager',
      promptReference: 'project-manager',
      capabilities: ['task_tracking', 'resource_allocation', 'timeline_management'],
      kpis: ['on_time_delivery', 'budget_adherence'],
      escalationPath: 'chief-of-staff',
      agentClass: ProjectManagerAgent,
    },
    {
      id: 'ceo-001',
      name: 'CEO',
      promptReference: 'ceo',
      capabilities: ['vision', 'strategy', 'decision_making'],
      kpis: ['company_growth', 'profitability'],
      escalationPath: 'board',
    },
    {
      id: 'finance-001',
      name: 'Finance',
      promptReference: 'finance',
      capabilities: ['budgeting', 'accounting', 'financial_reporting'],
      kpis: ['burn_rate', 'revenue_accuracy'],
      escalationPath: 'chief-of-staff',
    },
    {
      id: 'marketing-001',
      name: 'Marketing',
      promptReference: 'marketing',
      capabilities: ['branding', 'lead_generation', 'market_analysis'],
      kpis: ['customer_acquisition_cost', 'brand_awareness'],
      escalationPath: 'chief-of-staff',
    },
    {
      id: 'sales-001',
      name: 'Sales',
      promptReference: 'sales',
      capabilities: ['prospecting', 'closing', 'revenue_generation'],
      kpis: ['conversion_rate', 'sales_velocity'],
      escalationPath: 'chief-of-staff',
    },
    {
      id: 'ops-001',
      name: 'Operations',
      promptReference: 'operations',
      capabilities: ['process_optimization', 'supply_chain', 'logistics'],
      kpis: ['operational_efficiency', 'cost_reduction'],
      escalationPath: 'chief-of-staff',
    },
    {
      id: 'hr-001',
      name: 'HR',
      promptReference: 'hr',
      capabilities: ['recruitment', 'employee_engagement', 'compliance'],
      kpis: ['retention_rate', 'time_to_hire'],
      escalationPath: 'chief-of-staff',
    },
    {
      id: 'cs-001',
      name: 'Customer Success',
      promptReference: 'customer-success',
      capabilities: ['retention', 'support', 'upselling'],
      kpis: ['churn_rate', 'net_promoter_score'],
      escalationPath: 'chief-of-staff',
    },
    {
      id: 'km-001',
      name: 'Knowledge Manager',
      promptReference: 'knowledge-manager',
      capabilities: ['information_retrieval', 'documentation', 'learning'],
      kpis: ['information_accuracy', 'knowledge_coverage'],
      escalationPath: 'chief-of-staff',
    },
    {
      id: 'receptionist-001',
      name: 'Receptionist',
      promptReference: 'receptionist',
      capabilities: ['triage', 'scheduling', 'communication'],
      kpis: ['response_time', 'triage_accuracy'],
      escalationPath: 'chief-of-staff',
    },
  ];

  constructor(
    private readonly agentRegistry: AgentRegistry,
    private readonly modelRouter: ModelRouter,
    private readonly promptLoader: PromptLoader,
    @Optional() private readonly executionEngine?: any,
  ) {}

  async onModuleInit() {
    this.logger.log('Registering all departments...');
    for (const manifest of this.departments) {
      await this.registerDepartment(manifest);
    }
  }

  private async registerDepartment(manifest: DepartmentManifest) {
    const metadata: AgentMetadata = {
      id: manifest.id,
      name: manifest.name,
      role: manifest.promptReference,
      description: `AI Agent for ${manifest.name} department`,
      version: '1.0.0',
      capabilities: manifest.capabilities,
      permissions: ['read', 'write'],
      supportedModels: ['mini', 'gpt-5.6'],
      healthStatus: 'idle',
    };

    let agent;
    if (manifest.agentClass) {
      if (manifest.agentClass === ChiefOfStaffAgent || manifest.agentClass === ProjectManagerAgent) {
        agent = new manifest.agentClass(
          metadata,
          this.executionEngine,
          this.agentRegistry,
          this.modelRouter,
          this.promptLoader
        );
      } else {
        agent = new manifest.agentClass(metadata, this.modelRouter, this.promptLoader);
      }
    } else {
      agent = new DepartmentAgent(metadata, this.modelRouter, this.promptLoader);
    }

    await this.agentRegistry.register(agent);
  }
}
