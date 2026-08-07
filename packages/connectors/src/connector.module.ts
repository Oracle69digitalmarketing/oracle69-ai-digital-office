import { Module, OnModuleInit } from '@nestjs/common';
import { ConnectorRegistry } from './connector-registry.js';
import { ConnectorManager } from './connector-manager.js';
import { CredentialManager } from './credential-manager.js';
import { OAuthManager } from './oauth-manager.js';
import { SharedModule } from '@oracle69/shared';
import { MemoryModule } from '@oracle69/memory';
import { GoogleDriveConnector } from './google-drive.connector.js';
import { GoogleDocsConnector } from './google-docs.connector.js';
import { GmailConnector } from './gmail.connector.js';
import { GoogleCalendarConnector } from './google-calendar.connector.js';
import { SlackConnector } from './slack.connector.js';
import { HubSpotConnector } from './hubspot.connector.js';
import { SalesforceConnector } from './salesforce.connector.js';

@Module({
  imports: [SharedModule, MemoryModule],
  providers: [
    ConnectorRegistry,
    ConnectorManager,
    CredentialManager,
    OAuthManager,
    GoogleDriveConnector,
    GoogleDocsConnector,
    GmailConnector,
    GoogleCalendarConnector,
    SlackConnector,
    HubSpotConnector,
    SalesforceConnector,
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
    private drive: GoogleDriveConnector,
    private docs: GoogleDocsConnector,
    private gmail: GmailConnector,
    private calendar: GoogleCalendarConnector,
    private slack: SlackConnector,
    private hubspot: HubSpotConnector,
    private salesforce: SalesforceConnector
  ) {}

  onModuleInit() {
    this.registry.register(this.drive);
    this.registry.register(this.docs);
    this.registry.register(this.gmail);
    this.registry.register(this.calendar);
    this.registry.register(this.slack);
    this.registry.register(this.hubspot);
    this.registry.register(this.salesforce);
  }
}
