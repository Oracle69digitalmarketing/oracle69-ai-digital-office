import { Injectable } from '@nestjs/common';
import { ExecutionEngine } from '@oracle69/execution-engine';
import { MemoryManager } from '@oracle69/memory';
import { AgentRegistry } from '@oracle69/agent-engine';

@Injectable()
export class ReceptionistService {
  constructor(
    private executionEngine: ExecutionEngine,
    private memory: MemoryManager,
    private registry: AgentRegistry,
  ) {}

  async handleRequest(userId: string, message: string) {
    await this.memory.save(userId, { role: 'user', content: message });
    return {
      response: "Request received. Routing to Chief of Staff for execution.",
      status: "routed"
    };
  }
}
