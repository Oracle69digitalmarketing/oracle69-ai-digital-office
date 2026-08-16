import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConnectorRegistry } from "./connector-registry.js";
import { CredentialManager } from "./credential-manager.js";
import { OAuthManager } from "./oauth-manager.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorHealth } from "./types.js";
import { EventBus } from "@oracle69/shared";
import { MemoryManager } from "@oracle69/memory";

@Injectable()
export class ConnectorManager {
  private readonly logger = new Logger(ConnectorManager.name);

  constructor(
    private registry: ConnectorRegistry,
    private credentialManager: CredentialManager,
    private oauthManager: OAuthManager,
    private eventBus: EventBus,
    private memoryManager: MemoryManager,
  ) {}

  async executeAction(type: string, request: ConnectorActionRequest): Promise<ConnectorResult> {
    const connector = this.registry.resolve(type);
    if (!connector) {
      throw new NotFoundException(`Connector of type ${type} not found`);
    }

    this.logger.log(`Executing ${request.action} on ${type} for org ${request.organizationId}`);

    // 1. Get credentials
    let creds = await this.credentialManager.getCredentials(request.organizationId, type);

    // 2. Handle OAuth2 refresh if needed
    if (creds && creds.type === "oauth2") {
      const expired = await this.oauthManager.isTokenExpired(request.organizationId, type);
      if (expired) {
        await this.oauthManager.refreshToken(request.organizationId, type);
        creds = await this.credentialManager.getCredentials(request.organizationId, type);
      }
    }

    // 3. Connect
    await connector.connect(creds);

    // 4. Emit Workflow Event
    this.eventBus.publish({
      type: "workflow.step.started",
      source: `connector:${type}`,
      payload: {
        action: request.action,
        organizationId: request.organizationId,
        userId: request.userId,
        connectorId: connector.metadata.id,
      },
    });

    // 5. Audit Event
    this.eventBus.publish({
      type: "audit.action.executed",
      source: `connector:${type}`,
      payload: {
        action: request.action,
        resource: type,
        status: "pending",
        organizationId: request.organizationId,
        userId: request.userId,
      },
    });

    const startTime = Date.now();
    try {
      // 6. Execute
      const result = await connector.execute(request);
      const duration = Date.now() - startTime;

      // 7. Persistent Business Memory Record
      await this.memoryManager.saveBusinessMemory({
        sessionId: request.organizationId, // Using orgId as session for foundation
        taskId: request.action,
        agentId: connector.metadata.id,
        role: "connector",
        content: result.data,
        reasoning: `Executed connector action ${request.action}`,
        organizationId: request.organizationId,
        metadata: {
          connectorType: type,
          success: result.success,
          duration,
        },
      });

      // 8. Emit completion event
      this.eventBus.publish({
        type: result.success ? "workflow.step.completed" : "workflow.step.failed",
        source: `connector:${type}`,
        payload: {
          action: request.action,
          organizationId: request.organizationId,
          duration,
          success: result.success,
          error: result.error?.message,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.eventBus.publish({
        type: "workflow.step.failed",
        source: `connector:${type}`,
        payload: {
          action: request.action,
          organizationId: request.organizationId,
          duration,
          success: false,
          error: errorMessage,
        },
      });

      return {
        success: false,
        error: {
          code: "EXECUTION_FAILED",
          message: errorMessage,
          retryable: true,
        },
      };
    } finally {
      await connector.disconnect();
    }
  }

  async checkHealth(type?: string): Promise<Record<string, ConnectorHealth>> {
    const healthMap: Record<string, ConnectorHealth> = {};
    const connectors = type
      ? [this.registry.resolve(type)].filter(Boolean)
      : Array.from((this.registry as any).connectors.values());

    for (const connector of connectors as any[]) {
      healthMap[connector.metadata.type] = await connector.health();
    }

    return healthMap;
  }
}
