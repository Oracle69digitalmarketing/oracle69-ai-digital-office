import { Injectable, Logger } from '@nestjs/common';
import { IConnector, ConnectorMetadata } from './types.js';

@Injectable()
export class ConnectorRegistry {
  private readonly logger = new Logger(ConnectorRegistry.name);
  private connectors: Map<string, IConnector> = new Map();

  register(connector: IConnector) {
    this.connectors.set(connector.metadata.type, connector);
    this.logger.log(`Registered connector: ${connector.metadata.name} (${connector.metadata.type})`);
  }

  getConnector(type: string): IConnector | undefined {
    return this.connectors.get(type);
  }

  getAllMetadata(): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).map(c => c.metadata);
  }
}
