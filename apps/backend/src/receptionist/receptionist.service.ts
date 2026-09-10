import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ExecutionEngine } from "@oracle69/execution-engine";
import { MemoryManager, ConversationManager } from "@oracle69/memory";
import { AgentRegistry } from "@oracle69/agent-engine";
import { TaskContext, EventBus } from "@oracle69/shared";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class ReceptionistService {
  private readonly logger = new Logger(ReceptionistService.name);

  constructor(
    private executionEngine: ExecutionEngine,
    private memory: MemoryManager,
    private conversationManager: ConversationManager,
    private registry: AgentRegistry,
    private eventBus: EventBus,
    private tenantContext: TenantContextService,
  ) {}

  async handleRequest(userId: string, sessionId: string, message: string) {
    // Resolve the trusted tenant. Fails closed when no tenant context is active;
    // the "system" fallback tenant is never used for user/business operations.
    const organizationId = this.tenantContext.resolveTenantId();

    this.logger.log(
      `Handling request from ${userId} in session ${sessionId} for org ${organizationId}`,
    );

    if (!message || message.trim().length === 0) {
      throw new BadRequestException("Message cannot be empty");
    }

    // Tenant-scope the session/state key so receptionist memory cannot leak
    // across tenants. The raw sessionId supplied by the client is namespaced
    // under the trusted tenant; a client cannot reach another tenant's state.
    const scopedSessionId = `${organizationId}::${sessionId}`;

    // 1. Build context from memory
    await this.memory.saveSession(scopedSessionId, {
      role: "user",
      content: message,
    });
    const contextStr = await this.conversationManager.buildContext(scopedSessionId);

    // 2. Discover Chief of Staff scoped to the trusted tenant. A tenant can
    //    only retrieve agents that belong to it.
    const cosAgents = this.registry.findAgentsByRoleAndTenant(
      "chief-of-staff",
      organizationId,
    );
    if (cosAgents.length === 0) {
      this.logger.error(
        `Chief of Staff agent not found in registry for org ${organizationId}`,
      );
      throw new Error(
        `System misconfiguration: Chief of Staff not found for tenant ${organizationId}`,
      );
    }
    const cosAgent = cosAgents[0];

    // 3. Create Task Context for CoS
    const task: TaskContext = {
      taskId: Math.random().toString(36).substring(7),
      projectId: "default", // Should be resolved from context
      sessionId: scopedSessionId,
      organizationId,
      priority: "medium",
      objective: message,
      context: { conversationContext: contextStr },
    };

    // 4. Publish event with the trusted tenant
    this.eventBus.publish({
      type: "task.started",
      source: "ReceptionistService",
      payload: { taskId: task.taskId, sessionId, organizationId },
    });

    // 5. Execute via Execution Engine with tenant context for memory persistence
    const tenantContext = { organizationId, productIdentifier: "business-architect" };
    try {
      const result = await this.executionEngine.executeTask(task, cosAgent, 3, tenantContext);

      await this.memory.saveSession(scopedSessionId, {
        role: "assistant",
        content: result,
      });

      this.eventBus.publish({
        type: "task.completed",
        source: "ReceptionistService",
        payload: { taskId: task.taskId, result, organizationId },
      });

      return {
        taskId: task.taskId,
        response: result,
        status: "completed",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.eventBus.publish({
        type: "task.failed",
        source: "ReceptionistService",
        payload: { taskId: task.taskId, error: errorMessage, organizationId },
      });
      throw error;
    }
  }
}
