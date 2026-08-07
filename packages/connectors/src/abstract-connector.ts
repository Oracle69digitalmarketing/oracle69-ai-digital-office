import { Logger } from '@nestjs/common';
import { IConnector, ConnectorMetadata, ConnectorActionRequest, ConnectorResult, ConnectorHealth, ConnectorStatus } from './types.js';

export abstract class AbstractConnector implements IConnector {
  protected readonly logger: Logger;
  protected credentials: any;
  protected status: ConnectorStatus = 'disconnected';

  constructor(public readonly metadata: ConnectorMetadata) {
    this.logger = new Logger(`${metadata.name}Connector`);
  }

  async connect(credentials: any): Promise<void> {
    this.credentials = credentials;
    this.status = 'connected';
    this.logger.debug(`Connected with credentials type: ${credentials?.type || 'none'}`);
  }

  async disconnect(): Promise<void> {
    this.credentials = null;
    this.status = 'disconnected';
    this.logger.debug('Disconnected');
  }

  async authenticate(): Promise<boolean> {
    if (!this.credentials) return false;
    // Base implementation assumes credentials mean authenticated
    return true;
  }

  abstract execute(request: ConnectorActionRequest): Promise<ConnectorResult>;

  async health(): Promise<ConnectorHealth> {
    return {
      status: this.status,
      lastCheck: new Date(),
    };
  }
}
