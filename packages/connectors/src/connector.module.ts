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
import { OutlookConnector } from './outlook.connector.js';
import { TeamsConnector } from './teams.connector.js';
import { ZoomConnector } from './zoom.connector.js';
import { NotionConnector } from './notion.connector.js';
import { JiraConnector } from './jira.connector.js';
import { WhatsAppBusinessConnector } from './whatsapp.connector.js';

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
    OutlookConnector,
    TeamsConnector,
    ZoomConnector,
    NotionConnector,
    JiraConnector,
    WhatsAppBusinessConnector,
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
    private salesforce: SalesforceConnector,
    private outlook: OutlookConnector,
    private teams: TeamsConnector,
    private zoom: ZoomConnector,
    private notion: NotionConnector,
    private jira: JiraConnector,
    private whatsapp: WhatsAppBusinessConnector
  ) {}

  onModuleInit() {
    this.registry.register(this.drive);
    this.registry.register(this.docs);
    this.registry.register(this.gmail);
    this.registry.register(this.calendar);
    this.registry.register(this.slack);
    this.registry.register(this.hubspot);
    this.registry.register(this.salesforce);
    this.registry.register(this.outlook);
    this.registry.register(this.teams);
    this.registry.register(this.zoom);
    this.registry.register(this.notion);
    this.registry.register(this.jira);
    this.registry.register(this.whatsapp);
  }
}
