import { Injectable } from '@nestjs/common';
import { ExecutiveMetadata } from './executive.types.js';

@Injectable()
export class ExecutiveRegistry {
  private executives = new Map<string, ExecutiveMetadata>();

  registerExecutive(metadata: ExecutiveMetadata): void {
    this.executives.set(metadata.id, metadata);
  }

  findExecutive(id: string): ExecutiveMetadata | undefined {
    return this.executives.get(id);
  }
}
