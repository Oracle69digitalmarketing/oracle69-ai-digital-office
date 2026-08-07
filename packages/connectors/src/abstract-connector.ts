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
    this.logger.debug(`Connected to ${this.metadata.name}`);
  }

  async disconnect(): Promise<void> {
    this.credentials = null;
    this.status = 'disconnected';
    this.logger.debug(`Disconnected from ${this.metadata.name}`);
  }

  async authenticate(): Promise<boolean> {
    if (!this.credentials) {
      this.status = 'unauthorized';
      return false;
    }
    return true;
  }

  abstract execute(request: ConnectorActionRequest): Promise<ConnectorResult>;

  async health(): Promise<ConnectorHealth> {
    return {
      status: this.status,
      lastCheck: new Date(),
    };
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || i === maxRetries - 1) break;
        
        this.logger.warn(`Operation failed, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw lastError;
  }

  protected isRetryableError(error: any): boolean {
    // Basic implementation, can be overridden by specific connectors
    if (error?.response?.status) {
      const status = error.response.status;
      return status === 429 || (status >= 500 && status <= 599);
    }
    return true;
  }

  protected handleError(error: any): ConnectorResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`Connector error: ${errorMessage}`, error.stack);
    
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: errorMessage,
        details: error.details || error.response?.data,
        retryable: this.isRetryableError(error),
      },
    };
  }
}
