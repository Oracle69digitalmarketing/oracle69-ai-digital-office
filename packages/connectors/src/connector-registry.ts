import { Injectable, Logger } from '@nestjs/common';
import { IConnector, ConnectorMetadata } from './types.js';

@Injectable()
export class ConnectorRegistry {
  private readonly logger = new Logger(ConnectorRegistry.name);
  private connectors: Map<string, IConnector> = new Map();

  register(connector: IConnector) {
    if (this.connectors.has(connector.metadata.type)) {
      this.logger.warn(`Overwriting existing connector for type: ${connector.metadata.type}`);
    }
    this.connectors.set(connector.metadata.type, connector);
    this.logger.log(`Registered connector: ${connector.metadata.name} (${connector.metadata.type})`);
  }

  unregister(type: string) {
    if (this.connectors.has(type)) {
      this.connectors.delete(type);
      this.logger.log(`Unregistered connector type: ${type}`);
    }
  }

  resolve(type: string): IConnector | undefined {
    return this.connectors.get(type);
  }

  discover(): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).map(c => c.metadata);
  }

  // Alias for backward compatibility or different naming conventions
  getConnector(type: string): IConnector | undefined {
    return this.resolve(type);
  }

  getAllMetadata(): ConnectorMetadata[] {
    return this.discover();
  }
}
