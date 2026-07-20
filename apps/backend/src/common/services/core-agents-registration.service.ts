import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import {
  AgentRegistry,
  ChiefOfStaffAgent,
  ProjectManagerAgent,
  DepartmentAgent,
  ModelRouter,
  PromptLoader,
} from "@oracle69/agent-engine";
import { ExecutionEngine } from "@oracle69/execution-engine";

@Injectable()
export class CoreAgentsRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(CoreAgentsRegistrationService.name);

  constructor(
    private registry: AgentRegistry,
    private executionEngine: ExecutionEngine,
    private modelRouter: ModelRouter,
    private promptLoader: PromptLoader,
  ) {}

  async onModuleInit() {
    this.logger.log("Registering core organizational agents...");

    const agents = [
      {
        id: "cos-1",
        name: "Elena",
        role: "Chief of Staff",
        class: ChiefOfStaffAgent,
        capabilities: ["planning", "strategy"],
      },
      {
        id: "pm-1",
        name: "Paul",
        role: "Project Manager",
        class: ProjectManagerAgent,
        capabilities: ["coordination", "breakdown"],
      },
      {
        id: "mkt-1",
        name: "Mia",
        role: "Marketing",
        class: DepartmentAgent,
        capabilities: ["copywriting", "creative"],
      },
      {
        id: "fin-1",
        name: "Finn",
        role: "Finance",
        class: DepartmentAgent,
        capabilities: ["budgeting", "analysis"],
      },
      {
        id: "ops-1",
        name: "Owen",
        role: "Operations",
        class: DepartmentAgent,
        capabilities: ["logistics", "processes"],
      },
    ];

    for (const a of agents) {
      if (!this.registry.getAgent(a.id)) {
        const metadata: any = {
          id: a.id,
          name: a.name,
          role: a.role,
          description: `${a.role} agent`,
          version: "1.0.0",
          capabilities: a.capabilities,
          permissions: ["all"],
          supportedModels: ["mini"],
          healthStatus: "idle",
        };

        let agent;
        if (a.class === DepartmentAgent) {
          agent = new (a.class as any)(metadata, this.modelRouter, this.promptLoader);
        } else {
          agent = new (a.class as any)(
            metadata,
            this.executionEngine,
            this.registry,
            this.modelRouter,
            this.promptLoader,
          );
        }

        await this.registry.register(agent);
      }
    }
  }
}
