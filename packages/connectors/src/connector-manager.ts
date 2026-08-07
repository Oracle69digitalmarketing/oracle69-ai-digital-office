import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConnectorRegistry } from './connector-registry.js';
import { CredentialManager } from './credential-manager.js';
import { OAuthManager } from './oauth-manager.js';
import { ConnectorActionRequest, ConnectorResult } from './types.js';
import { EventBus } from '@oracle69/shared';

@Injectable()
export class ConnectorManager {
  private readonly logger = new Logger(ConnectorManager.name);

  constructor(
    private registry: ConnectorRegistry,
    private credentialManager: CredentialManager,
    private oauthManager: OAuthManager,
    private eventBus: EventBus,
  ) {}

  async executeAction(type: string, request: ConnectorActionRequest): Promise<ConnectorResult> {
    const connector = this.registry.getConnector(type);
    if (!connector) {
      throw new NotFoundException(`Connector of type ${type} not found`);
    }

    this.logger.log(`Executing ${request.action} on ${type} for org ${request.organizationId}`);

    // 1. Get credentials
    let creds = await this.credentialManager.getCredentials(request.organizationId, type);
    
    // 2. Handle OAuth2 refresh if needed
    if (creds && creds.type === 'oauth2') {
      const expired = await this.oauthManager.isTokenExpired(request.organizationId, type);
      if (expired) {
        await this.oauthManager.refreshToken(request.organizationId, type);
        creds = await this.credentialManager.getCredentials(request.organizationId, type);
      }
    }

    // 3. Connect
    await connector.connect(creds);

    // 4. Emit event
    this.eventBus.publish({
      type: 'connector.action.started',
      source: `connector:${type}`,
      payload: { 
        action: request.action, 
        organizationId: request.organizationId,
        userId: request.userId 
      },
    });

    const startTime = Date.now();
    try {
      // 5. Execute
      const result = await connector.execute(request);
      const duration = Date.now() - startTime;

      // 6. Emit completion event
      this.eventBus.publish({
        type: result.success ? 'connector.action.completed' : 'connector.action.failed',
        source: `connector:${type}`,
        payload: { 
          action: request.action, 
          organizationId: request.organizationId,
          duration,
          success: result.success,
          error: result.error?.message
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.eventBus.publish({
        type: 'connector.action.failed',
        source: `connector:${type}`,
        payload: { 
          action: request.action, 
          organizationId: request.organizationId,
          duration,
          success: false,
          error: errorMessage
        },
      });

      return {
        success: false,
        error: {
          code: 'EXECUTION_FAILED',
          message: errorMessage,
          retryable: true
        }
      };
    } finally {
      await connector.disconnect();
    }
  }
}
