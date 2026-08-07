import { Module } from '@nestjs/common';
import { ConnectorRegistry } from './connector-registry.js';
import { ConnectorManager } from './connector-manager.js';
import { CredentialManager } from './credential-manager.js';
import { OAuthManager } from './oauth-manager.js';
import { SharedModule } from '@oracle69/shared';

@Module({
  imports: [SharedModule],
  providers: [
    ConnectorRegistry,
    ConnectorManager,
    CredentialManager,
    OAuthManager,
  ],
  exports: [
    ConnectorRegistry,
    ConnectorManager,
    CredentialManager,
    OAuthManager,
  ],
})
export class ConnectorModule {}
