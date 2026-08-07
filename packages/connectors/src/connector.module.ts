import { Module, OnModuleInit } from '@nestjs/common';
import { ConnectorRegistry } from './connector-registry.js';
import { ConnectorManager } from './connector-manager.js';
import { CredentialManager } from './credential-manager.js';
import { OAuthManager } from './oauth-manager.js';
import { SharedModule } from '@oracle69/shared';
import { MemoryModule } from '@oracle69/memory';
import { GoogleDriveConnector } from './google-drive.connector.js';

@Module({
  imports: [SharedModule, MemoryModule],
  providers: [
    ConnectorRegistry,
    ConnectorManager,
    CredentialManager,
    OAuthManager,
    GoogleDriveConnector,
  ],
  exports: [
    ConnectorRegistry,
    ConnectorManager,
    CredentialManager,
    OAuthManager,
  ],
})
export class ConnectorModule implements OnModuleInit {
  constructor(
    private registry: ConnectorRegistry,
    private drive: GoogleDriveConnector
  ) {}

  onModuleInit() {
    this.registry.register(this.drive);
  }
}
