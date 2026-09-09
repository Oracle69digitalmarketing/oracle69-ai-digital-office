import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConnectorRegistry } from "./connector-registry.js";
import { CredentialManager } from "./credential-manager.js";
import { OAuthManager } from "./oauth-manager.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorHealth } from "./types.js";
import { EventBus } from "@oracle69/shared";
import { MemoryManager } from "@oracle69/memory";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class ConnectorManager {
  private readonly logger = new Logger(ConnectorManager.name);

  constructor(
    private registry: ConnectorRegistry,
    private credentialManager: CredentialManager,
    private oauthManager: OAuthManager,
    private eventBus: EventBus,
    private memoryManager: MemoryManager,
    private tenantContext: TenantContextService,
  ) {}

  async executeAction(type: string, request: ConnectorActionRequest): Promise<ConnectorResult> {
    const connector = this.registry.resolve(type);
    if (!connector) {
      throw new NotFoundException(`Connector of type ${type} not found`);
    }

    // Resolve the trusted tenant from the execution context. Fails closed when
    // no tenant context is active. The client-supplied request.organizationId
    // is never used to authorize credential/refresh/memory/event operations.
    const organizationId = this.tenantContext.resolveTenantId();

    this.logger.log(`Executing ${request.action} on ${type} for org ${organizationId}`);

    // 1. Get credentials scoped to the trusted tenant
    let creds = await this.credentialManager.getCredentials(organizationId, type);

    // 2. Handle OAuth2 refresh if needed, scoped to the trusted tenant
    if (creds && creds.type === "oauth2") {
      const expired = await this.oauthManager.isTokenExpired(organizationId, type);
      if (expired) {
        await this.oauthManager.refreshToken(organizationId, type);
        creds = await this.credentialManager.getCredentials(organizationId, type);
      }
    }

    // 3. Connect
    await connector.connect(creds);

    // 4. Emit Workflow Event with the trusted tenant
    this.eventBus.publish({
      type: "workflow.step.started",
      source: `connector:${type}`,
      payload: {
        action: request.action,
        organizationId,
        userId: request.userId,
        connectorId: connector.metadata.id,
      },
    });

    // 5. Audit Event with the trusted tenant
    this.eventBus.publish({
      type: "audit.action.executed",
      source: `connector:${type}`,
      payload: {
        action: request.action,
        resource: type,
        status: "pending",
        organizationId,
        userId: request.userId,
      },
    });

    const scopedSessionId = `${organizationId}::${type}`;
    const startTime = Date.now();
    try {
      // 6. Execute
      const result = await connector.execute(request);
      const duration = Date.now() - startTime;

      // 7. Persistent Business Memory Record scoped to the trusted tenant
      await this.memoryManager.saveBusinessMemory({
        sessionId: scopedSessionId, // Tenant-qualified so memory cannot be cross-read
        taskId: request.action,
        agentId: connector.metadata.id,
        role: "connector",
        content: result.data,
        reasoning: `Executed connector action ${request.action}`,
        organizationId,
        metadata: {
          connectorType: type,
          success: result.success,
          duration,
        },
      });

      // 8. Emit completion event with the trusted tenant
      this.eventBus.publish({
        type: result.success ? "workflow.step.completed" : "workflow.step.failed",
        source: `connector:${type}`,
        payload: {
          action: request.action,
          organizationId,
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
          organizationId,
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
