import { AbstractConnector } from './abstract-connector.js';
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from './types.js';
import { Client } from '@notionhq/client';

export class NotionConnector extends AbstractConnector {
  private notionClient?: Client;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'notion-01',
      name: 'Notion Connector',
      type: 'notion',
      version: '1.0.0',
      capabilities: [
        'create_page',
        'update_page',
        'search',
        'database_crud',
        'append_blocks',
        'read_page',
        'health_check'
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    this.notionClient = new Client({ auth: credentials.accessToken });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.notionClient) {
      return this.handleError(new Error('Notion client not initialized. Call connect() first.'));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case 'create_page':
          return this.createPage(request.params);
        case 'update_page':
          return this.updatePage(request.params);
        case 'search':
          return this.search(request.params);
        case 'database_crud':
          return this.databaseCrud(request.params);
        case 'append_blocks':
          return this.appendBlocks(request.params);
        case 'read_page':
          return this.readPage(request.params);
        case 'health_check':
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch(err => this.handleError(err));
  }

  private async createPage(params: any): Promise<ConnectorResult> {
    const response = await this.notionClient!.pages.create(params);
    return { success: true, data: response };
  }

  private async updatePage(params: any): Promise<ConnectorResult> {
    const { pageId, properties } = params;
    const response = await this.notionClient!.pages.update({ page_id: pageId, properties });
    return { success: true, data: response };
  }

  private async search(params: any): Promise<ConnectorResult> {
    const response = await this.notionClient!.search(params);
    return { success: true, data: response.results };
  }

  private async databaseCrud(params: any): Promise<ConnectorResult> {
    const { action, databaseId, ...data } = params;
    let response;
    const dbClient = (this.notionClient!.databases as any);
    if (action === 'create') response = await this.notionClient!.pages.create({ parent: { database_id: databaseId }, ...data });
    else if (action === 'query') response = await dbClient.query({ database_id: databaseId, ...data });
    else throw new Error(`Unsupported database action: ${action}`);
    return { success: true, data: response };
  }

  private async appendBlocks(params: any): Promise<ConnectorResult> {
    const { blockId, blocks } = params;
    const response = await this.notionClient!.blocks.children.append({ block_id: blockId, children: blocks });
    return { success: true, data: response };
  }

  private async readPage(params: any): Promise<ConnectorResult> {
    const { pageId } = params;
    const response = await this.notionClient!.pages.retrieve({ page_id: pageId });
    return { success: true, data: response };
  }

  async health(): Promise<any> {
    try {
      if (!this.notionClient) return { status: 'disconnected' };
      await this.notionClient.users.me({});
      return { status: 'connected', lastCheck: new Date() };
    } catch (error: any) {
      return { status: 'error', lastCheck: new Date(), error: error.message };
    }
  }
}