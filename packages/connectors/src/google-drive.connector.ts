import { AbstractConnector } from './abstract-connector.js';
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from './types.js';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export class GoogleDriveConnector extends AbstractConnector {
  private driveClient?: drive_v3.Drive;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'google-drive-01',
      name: 'Google Drive Connector',
      type: 'google-drive',
      version: '1.0.0',
      capabilities: [
        'upload_file',
        'download_file',
        'search_files',
        'list_folders',
        'create_folder',
        'delete_file',
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
    this.driveClient = google.drive({ version: 'v3', auth });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.driveClient) {
      return this.handleError(new Error('Drive client not initialized. Call connect() first.'));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case 'upload_file':
          return this.uploadFile(request.params);
        case 'download_file':
          return this.downloadFile(request.params);
        case 'search_files':
          return this.searchFiles(request.params);
        case 'list_folders':
          return this.listFolders(request.params);
        case 'create_folder':
          return this.createFolder(request.params);
        case 'delete_file':
          return this.deleteFile(request.params);
        case 'health_check':
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch(err => this.handleError(err));
  }

  private async uploadFile(params: any): Promise<ConnectorResult> {
    const { name, content, mimeType, parents } = params;
    const response = await this.driveClient!.files.create({
      requestBody: { name, mimeType, parents },
      media: {
        mimeType,
        body: typeof content === 'string' ? Readable.from([content]) : content,
      },
      fields: 'id, name, webViewLink',
    });
    return { success: true, data: response.data };
  }

  private async downloadFile(params: any): Promise<ConnectorResult> {
    const { fileId } = params;
    const response = await this.driveClient!.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    // In a real scenario, we might want to return the stream or buffer
    // For now, let's assume we return a summary and the stream can be handled by the caller if needed
    // But since execute returns JSON, we might need to buffer it or return a reference
    return { success: true, data: { fileId, status: 'download_started' } };
  }

  private async searchFiles(params: any): Promise<ConnectorResult> {
    const { q, pageSize = 10 } = params;
    const response = await this.driveClient!.files.list({
      q,
      pageSize,
      fields: 'files(id, name, mimeType, webViewLink)',
    });
    return { success: true, data: response.data.files };
  }

  private async listFolders(params: any): Promise<ConnectorResult> {
    const { parentId } = params;
    const q = `mimeType = 'application/vnd.google-apps.folder' ${parentId ? `and '${parentId}' in parents` : ''}`;
    const response = await this.driveClient!.files.list({
      q,
      fields: 'files(id, name, webViewLink)',
    });
    return { success: true, data: response.data.files };
  }

  private async createFolder(params: any): Promise<ConnectorResult> {
    const { name, parents } = params;
    const response = await this.driveClient!.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents,
      },
      fields: 'id, name',
    });
    return { success: true, data: response.data };
  }

  private async deleteFile(params: any): Promise<ConnectorResult> {
    const { fileId } = params;
    await this.driveClient!.files.delete({ fileId });
    return { success: true, data: { fileId, deleted: true } };
  }
}
