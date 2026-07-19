import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MemoryManager {
  private readonly logger = new Logger(MemoryManager.name);
  private shortTermMemory: Map<string, any[]> = new Map();

  async save(sessionId: string, data: any) {
    if (!this.shortTermMemory.has(sessionId)) {
      this.shortTermMemory.set(sessionId, []);
    }
    this.shortTermMemory.get(sessionId)?.push(data);
    this.logger.debug(`Saved memory for session: ${sessionId}`);
  }

  async getContext(sessionId: string): Promise<any[]> {
    return this.shortTermMemory.get(sessionId) || [];
  }
}
