import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ExecutionEngine } from "@oracle69/execution-engine";
import { MemoryManager, ConversationManager } from "@oracle69/memory";
import { AgentRegistry } from "@oracle69/agent-engine";
import { TaskContext, EventBus } from "@oracle69/shared";

@Injectable()
export class ReceptionistService {
  private readonly logger = new Logger(ReceptionistService.name);

  constructor(
    private executionEngine: ExecutionEngine,
    private memory: MemoryManager,
    private conversationManager: ConversationManager,
    private registry: AgentRegistry,
    private eventBus: EventBus,
  ) {}

  async handleRequest(userId: string, sessionId: string, message: string) {
    this.logger.log(`Handling request from ${userId} in session ${sessionId}`);

    if (!message || message.trim().length === 0) {
      throw new BadRequestException("Message cannot be empty");
    }

    // 1. Build context from memory
    await this.memory.saveSession(sessionId, { role: "user", content: message });
    const contextStr = await this.conversationManager.buildContext(sessionId);

    // 2. Discover Chief of Staff
    const cosAgents = this.registry.findAgentsByRole("Chief of Staff");
    if (cosAgents.length === 0) {
      this.logger.error("Chief of Staff agent not found in registry");
      throw new Error("System misconfiguration: Chief of Staff not found");
    }
    const cosAgent = cosAgents[0];

    // 3. Create Task Context for CoS
    const task: TaskContext = {
      taskId: Math.random().toString(36).substring(7),
      projectId: "default", // Should be resolved from context
      sessionId,
      priority: "medium",
      objective: message,
      context: { conversationContext: contextStr },
    };

    // 4. Publish event
    this.eventBus.publish({
      type: "TaskStarted",
      source: "ReceptionistService",
      payload: { taskId: task.taskId, sessionId },
    });

    // 5. Execute via Execution Engine
    try {
      const result = await this.executionEngine.executeTask(task, cosAgent);

      await this.memory.saveSession(sessionId, { role: "assistant", content: result });

      this.eventBus.publish({
        type: "TaskCompleted",
        source: "ReceptionistService",
        payload: { taskId: task.taskId, result },
      });

      return {
        taskId: task.taskId,
        response: result,
        status: "completed",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.eventBus.publish({
        type: "TaskFailed",
        source: "ReceptionistService",
        payload: { taskId: task.taskId, error: errorMessage },
      });
      throw error;
    }
  }
}
