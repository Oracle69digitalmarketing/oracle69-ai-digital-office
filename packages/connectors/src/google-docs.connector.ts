import { AbstractConnector } from './abstract-connector.js';
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from './types.js';
import { google, docs_v1, drive_v3 } from 'googleapis';

export class GoogleDocsConnector extends AbstractConnector {
  private docsClient?: docs_v1.Docs;
  private driveClient?: drive_v3.Drive;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'google-docs-01',
      name: 'Google Docs Connector',
      type: 'google-docs',
      version: '1.0.0',
      capabilities: [
        'create_document',
        'update_document',
        'append_content',
        'read_document',
        'export_pdf',
        'share_document',
        'health_check'
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
    this.docsClient = google.docs({ version: 'v1', auth });
    this.driveClient = google.drive({ version: 'v3', auth });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.docsClient || !this.driveClient) {
      return this.handleError(new Error('Docs/Drive client not initialized. Call connect() first.'));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case 'create_document':
          return this.createDocument(request.params);
        case 'update_document':
          return this.updateDocument(request.params);
        case 'append_content':
          return this.appendContent(request.params);
        case 'read_document':
          return this.readDocument(request.params);
        case 'export_pdf':
          return this.exportPdf(request.params);
        case 'share_document':
          return this.shareDocument(request.params);
        case 'health_check':
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch(err => this.handleError(err));
  }

  private async createDocument(params: any): Promise<ConnectorResult> {
    const { title } = params;
    const response = await this.docsClient!.documents.create({
      requestBody: { title },
    });
    return { success: true, data: response.data };
  }

  private async updateDocument(params: any): Promise<ConnectorResult> {
    const { documentId, requests } = params;
    const response = await this.docsClient!.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
    return { success: true, data: response.data };
  }

  private async appendContent(params: any): Promise<ConnectorResult> {
    const { documentId, text } = params;
    const response = await this.docsClient!.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              text,
              endOfSegmentLocation: {},
            },
          },
        ],
      },
    });
    return { success: true, data: response.data };
  }

  private async readDocument(params: any): Promise<ConnectorResult> {
    const { documentId } = params;
    const response = await this.docsClient!.documents.get({ documentId });
    return { success: true, data: response.data };
  }

  private async exportPdf(params: any): Promise<ConnectorResult> {
    const { documentId } = params;
    // Exporting as PDF requires Drive API
    const response = await this.driveClient!.files.export(
      { fileId: documentId, mimeType: 'application/pdf' },
      { responseType: 'stream' }
    );
    return { success: true, data: { documentId, status: 'export_started', mimeType: 'application/pdf' } };
  }

  private async shareDocument(params: any): Promise<ConnectorResult> {
    const { documentId, role = 'reader', type = 'user', emailAddress } = params;
    const response = await this.driveClient!.permissions.create({
      fileId: documentId,
      requestBody: { role, type, emailAddress },
    });
    return { success: true, data: response.data };
  }
}